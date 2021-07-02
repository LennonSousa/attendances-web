import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { Button, ButtonGroup, Col, Container, Row, Table } from 'react-bootstrap';
import { FaFingerprint, FaPencilAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import br from 'date-fns/locale/pt-BR';

import api from '../../../../api/api';
import { TokenVerify } from '../../../../utils/tokenVerify';
import { SideBarContext } from '../../../../contexts/SideBarContext';
import { AuthContext } from '../../../../contexts/AuthContext';
import { can } from '../../../../components/Users';
import { Employee } from '../../../../components/Employees';
import PageBack from '../../../../components/PageBack';
import { PageWaiting, PageType } from '../../../../components/PageWaiting';

export default function UserDetails() {
    const router = useRouter();
    const { employee } = router.query;

    const { loading, user } = useContext(AuthContext);

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);

    const [data, setData] = useState<Employee>();

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    useEffect(() => {
        handleItemSideBar('attendances');
        handleSelectedMenu('employees-index');

        if (user) {
            if (can(user, "employees", "read:any")) {
                api.get(`attendances/employees/${employee}`).then(res => {
                    setData(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error get employee to view, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setLoadingData(false);
                });
            }
        }
    }, [user]);

    function handleRoute(route: string) {
        router.push(route);
    }

    return !user || loading ? <PageWaiting status="waiting" /> :
        <>
            {
                can(user, "employees", "read:any") ? <>
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
                                                <Row>
                                                    <Col>
                                                        <Row className="mb-3">
                                                            <Col>
                                                                <PageBack href="/attendances/employees" subTitle="Voltar para a lista de funcionários" />
                                                            </Col>

                                                            <Col className="col-row">
                                                                <ButtonGroup size="sm" className="col-12">
                                                                    <Button
                                                                        title="Editar funcionário."
                                                                        variant="success"
                                                                        onClick={() => handleRoute(`/attendances/employees/edit/${data.id}`)}
                                                                    >
                                                                        <FaPencilAlt />
                                                                    </Button>
                                                                </ButtonGroup>
                                                            </Col>
                                                        </Row>

                                                        <Row className="align-items-center">
                                                            <Col className="col-row">
                                                                <h3 className="form-control-plaintext text-success">{data.name}</h3>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Col sm={4} >
                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-success">Criado em</span>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-secondary">{format(new Date(data.created_at), 'dd/MM/yyyy')}</h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>

                                                            <Col sm={4} >
                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-success">Criado por</span>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-secondary">{data.created_by}</h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                                </Row>

                                                <Col className="border-top mt-4 mb-3"></Col>

                                                <Row className="mt-3 mb-3">
                                                    <Col>
                                                        <Row>
                                                            <Col className="col-row">
                                                                <h6 className="text-success">Registros do mês <FaFingerprint /></h6>
                                                            </Col>
                                                        </Row>

                                                        <Row>
                                                            <Col>
                                                                <Table striped hover size="sm" responsive>
                                                                    <thead>
                                                                        <tr>
                                                                            <th >Entrada</th>
                                                                            <th >Saída</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {
                                                                            data.attendances.map((attendance, index) => {
                                                                                return <tr key={index}>
                                                                                    <td key={index}>{
                                                                                        attendance.in && format(new Date(attendance.in_at), 'Pp', { locale: br })
                                                                                    }
                                                                                    </td>

                                                                                    <td key={index}>{
                                                                                        attendance.out && format(new Date(attendance.out_at), 'Pp', { locale: br })
                                                                                    }
                                                                                    </td>
                                                                                </tr>
                                                                            })
                                                                        }
                                                                    </tbody>
                                                                    <caption>{`Registros encontrados: ${data.attendances.length}`}</caption>
                                                                </Table>
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                                </Row>
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