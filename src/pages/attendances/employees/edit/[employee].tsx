import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { Button, Col, Container, Form, Modal, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../../../api/api';
import { TokenVerify } from '../../../../utils/tokenVerify';
import { SideBarContext } from '../../../../contexts/SideBarContext';
import { AuthContext } from '../../../../contexts/AuthContext';
import { can } from '../../../../components/Users';
import { Employee } from '../../../../components/Employees';
import { Shift } from '../../../../components/Shifts';
import PageBack from '../../../../components/PageBack';
import { AlertMessage, statusModal } from '../../../../components/interfaces/AlertMessage';
import { PageWaiting, PageType } from '../../../../components/PageWaiting';

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!'),
    pin: Yup.string().notRequired().max(4, 'Deve conter no máximo 4 caracteres!').min(4, 'No mínimo 4 caracteres').required('Obrigatório!'),
    shift: Yup.string().required('Obrigatório!'),
});

export default function UserEdit() {
    const router = useRouter();
    const { employee } = router.query;

    const { loading, user } = useContext(AuthContext);

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);

    const [data, setData] = useState<Employee>();
    const [shifts, setShifts] = useState<Shift[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [messageShow, setMessageShow] = useState(false);
    const [deletingMessageShow, setDeletingMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [showItemDelete, setShowItemDelete] = useState(false);

    const handleCloseItemDelete = () => setShowItemDelete(false);
    const handelShowItemDelete = () => setShowItemDelete(true);

    useEffect(() => {
        handleItemSideBar('attendances');
        handleSelectedMenu('employees-index');

        if (user) {
            if (can(user, "employees", "update:any")) {
                api.get(`attendances/employees/${employee}`).then(res => {
                    setData(res.data);

                    api.get('attendances/shifts').then(res => {
                        setShifts(res.data);
                    }).catch(err => {
                        console.log('Error to get shifts, ', err);
                    });

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error get employee to edit, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setLoadingData(false);
                });
            }
        }
    }, [user]);

    async function handleItemDelete() {
        if (user) {
            setTypeMessage("waiting");
            setDeletingMessageShow(true);

            try {
                if (can(user, "employees", "delete")) {
                    await api.delete(`attendances/employees/${employee}`);

                    setTypeMessage("success");

                    setTimeout(() => {
                        router.push('/attendances/employees');
                    }, 1500);
                }
            }
            catch (err) {
                console.log('error deleting employee');
                console.log(err);

                setTypeMessage("error");

                setTimeout(() => {
                    setDeletingMessageShow(false);
                }, 4000);
            }
        }
    }

    return !user || loading ? <PageWaiting status="waiting" /> :
        <>
            {
                can(user, "employees", "update:any") ? <>
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
                                                        pin: data.pin,
                                                        shift: data.shift.id,
                                                    }}
                                                    onSubmit={async values => {
                                                        setTypeMessage("waiting");
                                                        setMessageShow(true);

                                                        try {
                                                            await api.put(`attendances/employees/${data.id}`, {
                                                                name: values.name,
                                                                pin: values.pin,
                                                                shift: values.shift,
                                                            });

                                                            setTypeMessage("success");

                                                            setTimeout(() => {
                                                                router.push(`/attendances/employees/details/${data.id}`);
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
                                                                        href={`/attendances/employees/details/${data.id}`}
                                                                        subTitle="Voltar para os detalhes do funcionário."
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
                                                                </Form.Group>

                                                                <Form.Group as={Col} sm={4} controlId="formGridPin">
                                                                    <Form.Label>PIN</Form.Label>
                                                                    <Form.Control
                                                                        type="text"
                                                                        maxLength={15}
                                                                        onChange={handleChange}
                                                                        onBlur={handleBlur}
                                                                        value={values.pin}
                                                                        name="pin"
                                                                        isInvalid={!!errors.pin && touched.pin}
                                                                    />
                                                                    <Form.Control.Feedback type="invalid">{touched.pin && errors.pin}</Form.Control.Feedback>
                                                                    <Form.Text className="text-muted text-right">{`${values.pin.length}/4 caracteres.`}</Form.Text>
                                                                </Form.Group>
                                                            </Row>

                                                            <Row className="mb-3">
                                                                <Form.Group as={Col} sm={4} controlId="formGridShift">
                                                                    <Form.Label>Turno</Form.Label>
                                                                    <Form.Control
                                                                        as="select"
                                                                        onChange={handleChange}
                                                                        onBlur={handleBlur}
                                                                        value={values.shift}
                                                                        name="shift"
                                                                        isInvalid={!!errors.shift && touched.shift}
                                                                    >
                                                                        <option hidden>...</option>
                                                                        {
                                                                            shifts.map((shift, index) => {
                                                                                return <option key={index} value={shift.id}>{shift.name}</option>
                                                                            })
                                                                        }
                                                                    </Form.Control>
                                                                    <Form.Control.Feedback type="invalid">{touched.shift && errors.shift}</Form.Control.Feedback>
                                                                </Form.Group>
                                                            </Row>

                                                            <Row className="justify-content-end">
                                                                {
                                                                    messageShow ? <Col sm={3}><AlertMessage status={typeMessage} /></Col> :
                                                                        <>
                                                                            {
                                                                                can(user, "employees", "delete")
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

                                                <Modal show={showItemDelete} onHide={handleCloseItemDelete}>
                                                    <Modal.Header closeButton>
                                                        <Modal.Title>Excluir funcionário</Modal.Title>
                                                    </Modal.Header>
                                                    <Modal.Body>
                                                        Você tem certeza que deseja excluir este funcionário? Essa ação não poderá ser desfeita.
                                                    </Modal.Body>
                                                    <Modal.Footer>
                                                        <Row>
                                                            {
                                                                deletingMessageShow ? <Col><AlertMessage status={typeMessage} /></Col> :
                                                                    <>
                                                                        {
                                                                            can(user, "employees", "delete")
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