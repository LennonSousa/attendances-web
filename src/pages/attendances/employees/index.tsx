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
import Employees, { Employee } from '../../../components/Employees';
import { PageWaiting } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/interfaces/AlertMessage';

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
});

export default function Institutions() {
    const router = useRouter();
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [employees, setEmployees] = useState<Employee[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<statusModal>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Carregando...');

    useEffect(() => {
        handleItemSideBar('attendances');
        handleSelectedMenu('employees-index');

        if (user && can(user, "employees", "read:any")) {
            api.get('attendances/employees').then(res => {
                setEmployees(res.data);

                setLoadingData(false);
            }).catch(err => {
                console.log('Error to get employees, ', err);

                setTypeLoadingMessage("error");
                setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                setLoadingData(false);
            });
        }
    }, [user]);

    function goNewEmployee() {
        router.push('/attendances/employees/new');
    }

    return !user || loading ? <PageWaiting status="waiting" /> :
        <>
            {
                can(user, "employees", "read:any") ? <Container className="content-page">
                    {
                        can(user, "employees", "create") && <Row>
                            <Col>
                                <Button variant="outline-success" onClick={goNewEmployee}>
                                    <FaPlus /> Criar um funcionário
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
                                        user && !!employees.length ? <Col>
                                            <ListGroup>
                                                {
                                                    employees && employees.map((employee, index) => {
                                                        return <Employees
                                                            key={index}
                                                            employee={employee}
                                                        />
                                                    })
                                                }
                                            </ListGroup>
                                        </Col> :
                                            <Col>
                                                <Row>
                                                    <Col className="text-center">
                                                        <p style={{ color: 'var(--gray)' }}>Você ainda não tem nenhum funcionário registrado.</p>
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