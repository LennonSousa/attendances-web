import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { Button, Col, Container, Form, ListGroup, Modal, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaCalendarAlt, FaPlus } from 'react-icons/fa';

import api from '../../../../api/api';
import { TokenVerify } from '../../../../utils/tokenVerify';
import { SideBarContext } from '../../../../contexts/SideBarContext';
import { AuthContext } from '../../../../contexts/AuthContext';
import { can } from '../../../../components/Users';
import { Shift } from '../../../../components/Shifts';
import ShiftDays from '../../../../components/ShiftDays';
import PageBack from '../../../../components/PageBack';
import { AlertMessage, statusModal } from '../../../../components/interfaces/AlertMessage';
import { PageWaiting, PageType } from '../../../../components/PageWaiting';

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    tolerance: Yup.number().notRequired(),
});

const dayValidationSchema = Yup.object().shape({
    week_day: Yup.number().required('Obrigatório!'),
    shift: Yup.string().required(),
});

export default function UserEdit() {
    const router = useRouter();
    const { shift } = router.query;

    const { loading, user } = useContext(AuthContext);

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);

    const [data, setData] = useState<Shift>();

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [messageShow, setMessageShow] = useState(false);
    const [dayMessageShow, setDayMessageShow] = useState(false);
    const [deletingMessageShow, setDeletingMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [showNewItem, setShowNewItem] = useState(false);

    const handleCloseNewItem = () => setShowNewItem(false);
    const handelShowNewItem = () => setShowNewItem(true);

    const [showItemDelete, setShowItemDelete] = useState(false);

    const handleCloseItemDelete = () => setShowItemDelete(false);
    const handelShowItemDelete = () => setShowItemDelete(true);

    useEffect(() => {
        handleItemSideBar('attendances');
        handleSelectedMenu('shifts-index');

        if (user) {
            if (can(user, "shifts", "update:any")) {
                api.get(`employees/shifts/${shift}`).then(res => {
                    setData(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error get shift to edit, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                });
            }
        }
    }, [user]);

    async function handleItemDelete() {
        if (user) {
            setTypeMessage("waiting");
            setDeletingMessageShow(true);

            try {
                if (can(user, "shifts", "delete")) {
                    await api.delete(`employees/shifts/${shift}`);

                    setTypeMessage("success");

                    setTimeout(() => {
                        router.push('/attendances/shifts');
                    }, 1500);
                }
            }
            catch (err) {
                console.log('error deleting shift');
                console.log(err);

                setTypeMessage("error");

                setTimeout(() => {
                    setDeletingMessageShow(false);
                }, 4000);
            }
        }
    }

    async function handleListDays() {
        api.get(`employees/shifts/${shift}`).then(res => {
            setData(res.data);

            setLoadingData(false);
        }).catch(err => {
            console.log('Error get shift to edit, ', err);

            setTypeLoadingMessage("error");
            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
            setLoadingData(false);
        });
    }

    return !user || loading ? <PageWaiting status="waiting" /> :
        <>
            {
                can(user, "shifts", "update:any") ? <>
                    {
                        loadingData ? <PageWaiting
                            status={typeLoadingMessage}
                            message={textLoadingMessage}
                        /> :
                            <>
                                {
                                    !data ? <PageWaiting status="waiting" /> :
                                        <Container className="content-page">
                                            <>
                                                <Formik
                                                    initialValues={{
                                                        name: data.name,
                                                        tolerance: data.tolerance,
                                                    }}
                                                    onSubmit={async values => {
                                                        setTypeMessage("waiting");
                                                        setMessageShow(true);

                                                        try {
                                                            await api.put(`employees/shifts/${data.id}`, {
                                                                name: values.name,
                                                                tolerance: values.tolerance,
                                                            });

                                                            setTypeMessage("success");

                                                            setTimeout(() => {
                                                                router.push(`/attendances/shifts/details/${data.id}`);
                                                            }, 1500);
                                                        }
                                                        catch {
                                                            setTypeMessage("error");

                                                            setTimeout(() => {
                                                                setMessageShow(false);
                                                            }, 4000);
                                                        }
                                                    }}
                                                    validationSchema={validationSchema}
                                                >
                                                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                                                        <Form onSubmit={handleSubmit}>
                                                            <Row className="mb-3">
                                                                <Col>
                                                                    <PageBack
                                                                        href={`/attendances/shifts/details/${data.id}`}
                                                                        subTitle="Voltar para os detalhes do turno."
                                                                    />
                                                                </Col>
                                                            </Row>

                                                            <Row className="mb-3">
                                                                <Form.Group as={Col} sm={8} controlId="formGridName">
                                                                    <Form.Label>Nome</Form.Label>
                                                                    <Form.Control
                                                                        type="name"
                                                                        onChange={handleChange}
                                                                        onBlur={handleBlur}
                                                                        value={values.name}
                                                                        name="name"
                                                                        isInvalid={!!errors.name && touched.name}
                                                                    />
                                                                    <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                                                    <Form.Text className="text-muted text-right">{`${values.name.length}/50 caracteres.`}</Form.Text>
                                                                </Form.Group>

                                                                <Form.Group as={Col} sm={4} controlId="formLoginTolerance">
                                                                    <Form.Label>Tolerância (em minutos)</Form.Label>
                                                                    <Form.Control
                                                                        type="text"
                                                                        maxLength={15}
                                                                        onChange={handleChange}
                                                                        onBlur={handleBlur}
                                                                        value={values.tolerance}
                                                                        name="tolerance"
                                                                        isInvalid={!!errors.tolerance && touched.tolerance}
                                                                    />
                                                                    <Form.Control.Feedback type="invalid">{touched.tolerance && errors.tolerance}</Form.Control.Feedback>
                                                                </Form.Group>
                                                            </Row>

                                                            <Row className="justify-content-end">
                                                                {
                                                                    messageShow ? <Col sm={3}><AlertMessage status={typeMessage} /></Col> :
                                                                        <>
                                                                            {
                                                                                can(user, "shifts", "delete")
                                                                                && <Col className="col-row">
                                                                                    <Button
                                                                                        variant="danger"
                                                                                        onClick={handelShowItemDelete}
                                                                                    >
                                                                                        Excluir
                                                                                    </Button>
                                                                                </Col>
                                                                            }

                                                                            <Col className="col-row">
                                                                                <Button variant="success" type="submit">Salvar</Button>
                                                                            </Col>
                                                                        </>
                                                                }
                                                            </Row>
                                                        </Form>
                                                    )}
                                                </Formik>

                                                <Col className="border-top mt-4 mb-3"></Col>

                                                <Row className="mt-3 mb-3">
                                                    <Col>
                                                        <Row>
                                                            <Col className="col-row">
                                                                <h6 className="text-success">Dias <FaCalendarAlt /></h6>
                                                            </Col>

                                                            <Col className="col-row">
                                                                <Button
                                                                    variant="outline-success"
                                                                    size="sm"
                                                                    onClick={handelShowNewItem}
                                                                    title="Criar um novo dia para este turno."
                                                                >
                                                                    <FaPlus />
                                                                </Button>
                                                            </Col>
                                                        </Row>

                                                        <Row>
                                                            <Col>
                                                                <ListGroup className="mb-3">
                                                                    {
                                                                        data.days.map(day => {
                                                                            return <ShiftDays
                                                                                key={day.id}
                                                                                day={day}
                                                                                handleListDays={handleListDays}
                                                                            />
                                                                        })
                                                                    }
                                                                </ListGroup>
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                                </Row>

                                                <Modal show={showNewItem} onHide={handleCloseNewItem}>
                                                    <Modal.Header closeButton>
                                                        <Modal.Title>Adicionar dia ao turno</Modal.Title>
                                                    </Modal.Header>
                                                    <Formik
                                                        initialValues={
                                                            {
                                                                week_day: '',
                                                                shift: data.id,
                                                            }
                                                        }
                                                        onSubmit={async values => {
                                                            setTypeMessage("waiting");
                                                            setDayMessageShow(true);

                                                            try {
                                                                await api.post('attendances/shifts/days', {
                                                                    week_day: values.week_day,
                                                                    shift: values.shift,
                                                                });

                                                                await handleListDays();

                                                                setTypeMessage("success");

                                                                setTimeout(() => {
                                                                    setDayMessageShow(false);
                                                                    handleCloseNewItem();
                                                                }, 1000);
                                                            }
                                                            catch (err) {
                                                                console.log('error to create day.');
                                                                console.log(err);

                                                                setTypeMessage("error");

                                                                setTimeout(() => {
                                                                    setDayMessageShow(false);
                                                                }, 4000);
                                                            }
                                                        }}
                                                        validationSchema={dayValidationSchema}
                                                    >
                                                        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                                                            <Form onSubmit={handleSubmit}>
                                                                <Modal.Body>
                                                                    <Form.Group controlId="dayFormGridWeekDay">
                                                                        <Form.Label>Dia da semana</Form.Label>
                                                                        <Form.Control
                                                                            as="select"
                                                                            onChange={handleChange}
                                                                            onBlur={handleBlur}
                                                                            value={values.week_day}
                                                                            name="week_day"
                                                                            isInvalid={!!errors.week_day && touched.week_day}
                                                                        >
                                                                            <option hidden>...</option>
                                                                            <option value={0}>Domingo</option>
                                                                            <option value={1}>Segunda-feira</option>
                                                                            <option value={2}>Terça-feira</option>
                                                                            <option value={3}>Quarta-feira</option>
                                                                            <option value={4}>Quinta-feira</option>
                                                                            <option value={5}>Sexta-feira</option>
                                                                            <option value={6}>Sábado</option>
                                                                        </Form.Control>
                                                                        <Form.Control.Feedback type="invalid">{touched.week_day && errors.week_day}</Form.Control.Feedback>
                                                                    </Form.Group>

                                                                </Modal.Body>
                                                                <Modal.Footer>
                                                                    {
                                                                        dayMessageShow ? <AlertMessage status={typeMessage} /> :
                                                                            <>
                                                                                <Button variant="secondary" onClick={handleCloseNewItem}>Cancelar</Button>
                                                                                <Button variant="success" type="submit">Salvar</Button>
                                                                            </>

                                                                    }
                                                                </Modal.Footer>
                                                            </Form>
                                                        )}
                                                    </Formik>
                                                </Modal>

                                                <Modal show={showItemDelete} onHide={handleCloseItemDelete}>
                                                    <Modal.Header closeButton>
                                                        <Modal.Title>Excluir turno</Modal.Title>
                                                    </Modal.Header>
                                                    <Modal.Body>
                                                        Você tem certeza que deseja excluir este turno? Essa ação não poderá ser desfeita.
                                                    </Modal.Body>
                                                    <Modal.Footer>
                                                        <Row>
                                                            {
                                                                deletingMessageShow ? <Col><AlertMessage status={typeMessage} /></Col> :
                                                                    <>
                                                                        {
                                                                            can(user, "shifts", "delete")
                                                                            && <Col className="col-row">
                                                                                <Button
                                                                                    variant="danger"
                                                                                    type="button"
                                                                                    onClick={handleItemDelete}
                                                                                >
                                                                                    Excluir
                                                                                </Button>
                                                                            </Col>
                                                                        }

                                                                        <Button
                                                                            className="col-row"
                                                                            variant="outline-secondary"
                                                                            onClick={handleCloseItemDelete}
                                                                        >
                                                                            Cancelar
                                                                        </Button>
                                                                    </>
                                                            }
                                                        </Row>
                                                    </Modal.Footer>
                                                </Modal>
                                            </>
                                        </Container>
                                }
                            </>
                    }
                </> :
                    <PageWaiting status="warning" message="Acesso negado!" />
            }

        </>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { token } = context.req.cookies;

    const tokenVerified = await TokenVerify(token);

    if (tokenVerified === "not-authorized") { // Not authenticated, token invalid!
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    if (tokenVerified === "error") { // Server error!
        return {
            redirect: {
                destination: '/500',
                permanent: false,
            },
        }
    }

    return {
        props: {},
    }
}