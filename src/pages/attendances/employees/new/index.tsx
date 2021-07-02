import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../../../api/api';
import { TokenVerify } from '../../../../utils/tokenVerify';
import { SideBarContext } from '../../../../contexts/SideBarContext';
import { AuthContext } from '../../../../contexts/AuthContext';
import { can } from '../../../../components/Users';
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

    const { loading, user } = useContext(AuthContext);

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);

    const [shifts, setShifts] = useState<Shift[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    useEffect(() => {
        handleItemSideBar('attendances');
        handleSelectedMenu('employees-new');

        if (user) {
            if (can(user, "employees", "create")) {
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
        }
    }, [user]);

    return !user || loading ? <PageWaiting status="waiting" /> :
        <>
            {
                can(user, "employees", "update:any") ? <>
                    {
                        loadingData ? <PageWaiting
                            status={typeLoadingMessage}
                            message={textLoadingMessage}
                        /> :
                            <Container className="content-page">
                                <Formik
                                    initialValues={{
                                        name: '',
                                        pin: '',
                                        shift: '',
                                    }}
                                    onSubmit={async values => {
                                        setTypeMessage("waiting");
                                        setMessageShow(true);

                                        try {
                                            await api.post('attendances/employees', {
                                                name: values.name,
                                                pin: values.pin,
                                                shift: values.shift,
                                            });

                                            setTypeMessage("success");

                                            setTimeout(() => {
                                                router.push('/attendances/employees');
                                            }, 1000);
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
                                                        href={'/attendances/employees'}
                                                        subTitle="Voltar para a lista de funcionários."
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
                                                        <Col className="col-row">
                                                            <Button variant="success" type="submit">Salvar</Button>
                                                        </Col>
                                                }
                                            </Row>
                                        </Form>
                                    )}
                                </Formik>
                            </Container>
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