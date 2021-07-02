import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { Button, Col, Container, Image, Form, ListGroup, Modal, Row } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import Shifts, { Shift } from '../../../components/Shifts';
import { PageWaiting } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/interfaces/AlertMessage';

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
});

export default function Institutions() {
    const router = useRouter();
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [shifts, setShifts] = useState<Shift[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<statusModal>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Carregando...');

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [showModalNewItem, setShowModalNewItem] = useState(false);

    const handleCloseModalNewItem = () => setShowModalNewItem(false);
    const handleShowModalNewItem = () => setShowModalNewItem(true);

    useEffect(() => {
        handleItemSideBar('attendances');
        handleSelectedMenu('shifts-index');

        if (user && can(user, "shifts", "read:any")) {
            api.get('attendances/shifts').then(res => {
                setShifts(res.data);

                setLoadingData(false);
            }).catch(err => {
                console.log('Error to get shifts, ', err);

                setTypeLoadingMessage("error");
                setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                setLoadingData(false);
            });
        }
    }, [user]);

    async function handleListShifts() {
        const res = await api.get('attendances/shifts');

        setShifts(res.data);
    }

    return !user || loading ? <PageWaiting status="waiting" /> :
        <>
            {
                can(user, "shifts", "read:any") ? <Container className="content-page">
                    {
                        can(user, "shifts", "create") && <Row>
                            <Col>
                                <Button variant="outline-success" onClick={handleShowModalNewItem}>
                                    <FaPlus /> Criar um turno
                                </Button>
                            </Col>
                        </Row>
                    }

                    <article className="mt-3">
                        {
                            loadingData ? <Col>
                                <Row>
                                    <Col>
                                        <AlertMessage status={typeLoadingMessage} message={textLoadingMessage} />
                                    </Col>
                                </Row>

                                {
                                    typeLoadingMessage === "error" && <Row className="justify-content-center mt-3 mb-3">
                                        <Col sm={3}>
                                            <Image src="/assets/images/undraw_server_down_s4lk.svg" alt="Erro de conexão." fluid />
                                        </Col>
                                    </Row>
                                }
                            </Col> :
                                <Row>
                                    {
                                        user && !!shifts.length ? <Col>
                                            <ListGroup>
                                                {
                                                    shifts && shifts.map((shift, index) => {
                                                        return <Shifts
                                                            key={index}
                                                            shift={shift}
                                                        />
                                                    })
                                                }
                                            </ListGroup>
                                        </Col> :
                                            <Col>
                                                <Row>
                                                    <Col className="text-center">
                                                        <p style={{ color: 'var(--gray)' }}>Você ainda não tem nenhum turno registrado.</p>
                                                    </Col>
                                                </Row>

                                                <Row className="justify-content-center mt-3 mb-3">
                                                    <Col sm={3}>
                                                        <Image src="/assets/images/undraw_not_found.svg" alt="Sem dados para mostrar." fluid />
                                                    </Col>
                                                </Row>
                                            </Col>
                                    }
                                </Row>
                        }
                    </article>

                    <Modal show={showModalNewItem} onHide={handleCloseModalNewItem}>
                        <Modal.Header closeButton>
                            <Modal.Title>Criar um turno</Modal.Title>
                        </Modal.Header>
                        <Formik
                            initialValues={
                                {
                                    name: '',
                                }
                            }
                            onSubmit={async values => {
                                if (can(user, "shifts", "create")) {
                                    setTypeMessage("waiting");
                                    setMessageShow(true);

                                    try {
                                        const res = await api.post('attendances/shifts', {
                                            name: values.name,
                                        });

                                        const shift: Shift = res.data;

                                        await handleListShifts();

                                        setTypeMessage("success");

                                        setTimeout(() => {
                                            setMessageShow(false);

                                            router.push(`/attendances/shifts/edit/${shift.id}`);
                                        }, 1000);
                                    }
                                    catch (err) {
                                        setTypeMessage("error");

                                        setTimeout(() => {
                                            setMessageShow(false);
                                        }, 4000);

                                        console.log('error create shift.');
                                        console.log(err);
                                    }
                                }
                            }}
                            validationSchema={validationSchema}
                        >
                            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                                <Form onSubmit={handleSubmit}>
                                    <Modal.Body>
                                        <Form.Group controlId="shiftFormGridName">
                                            <Form.Label>Nome do turno</Form.Label>
                                            <Form.Control type="text"
                                                placeholder="Nome"
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                value={values.name}
                                                name="name"
                                                isInvalid={!!errors.name && touched.name}
                                            />
                                            <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                            <Form.Text className="text-muted text-right">{`${values.name.length}/50 caracteres.`}</Form.Text>
                                        </Form.Group>

                                    </Modal.Body>
                                    <Modal.Footer>
                                        {
                                            messageShow ? <AlertMessage status={typeMessage} /> :
                                                <>
                                                    <Button variant="secondary" onClick={handleCloseModalNewItem}>
                                                        Cancelar
                                                    </Button>
                                                    <Button variant="success" type="submit">Continuar</Button>
                                                </>

                                        }
                                    </Modal.Footer>
                                </Form>
                            )}
                        </Formik>
                    </Modal>
                </Container> :
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