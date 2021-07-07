import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { Button, ButtonGroup, Col, Container, ListGroup, Row } from 'react-bootstrap';
import { FaCalendarAlt, FaPencilAlt } from 'react-icons/fa';

import api from '../../../../api/api';
import { TokenVerify } from '../../../../utils/tokenVerify';
import { SideBarContext } from '../../../../contexts/SideBarContext';
import { AuthContext } from '../../../../contexts/AuthContext';
import { can } from '../../../../components/Users';
import { Shift } from '../../../../components/Shifts';
import ShiftDays from '../../../../components/ShiftDays';
import PageBack from '../../../../components/PageBack';
import { PageWaiting, PageType } from '../../../../components/PageWaiting';

export default function UserDetails() {
    const router = useRouter();
    const { shift } = router.query;

    const { loading, user } = useContext(AuthContext);

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);

    const [data, setData] = useState<Shift>();

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    useEffect(() => {
        handleItemSideBar('attendances');
        handleSelectedMenu('shifts-index');

        if (user) {
            if (can(user, "shifts", "read:any")) {
                api.get(`employees/shifts/${shift}`).then(res => {
                    setData(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error get shift to view, ', err);

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
                can(user, "shifts", "read:any") ? <>
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
                                                                <PageBack href="/attendances/shifts" subTitle="Voltar para a lista de turnos" />
                                                            </Col>

                                                            <Col className="col-row">
                                                                <ButtonGroup size="sm" className="col-12">
                                                                    <Button
                                                                        title="Editar turno."
                                                                        variant="success"
                                                                        onClick={() => handleRoute(`/attendances/shifts/edit/${data.id}`)}
                                                                    >
                                                                        <FaPencilAlt />
                                                                    </Button>
                                                                </ButtonGroup>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Col sm={8} >
                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-success">Nome</span>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-secondary">{data.name}</h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>

                                                            <Col sm={4} >
                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-success">Tolerância</span>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-secondary">{data.tolerance}</h6>
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
                                                                <h6 className="text-success">Dias <FaCalendarAlt /></h6>
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
                                                                                canEdit={false}
                                                                            />
                                                                        })
                                                                    }
                                                                </ListGroup>
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