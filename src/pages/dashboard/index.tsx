import { useContext, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { Col, Container, Row } from 'react-bootstrap';

import { TokenVerify } from '../../utils/tokenVerify';
import { SideBarContext } from '../../contexts/SideBarContext';
import { AuthContext } from '../../contexts/AuthContext';
import { PageWaiting } from '../../components/PageWaiting';

export default function Dashboard() {
    const router = useRouter();

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, signed, user } = useContext(AuthContext);

    useEffect(() => {
        router.push('/attendances');
        // if (signed && user) {
        //     handleItemSideBar('dashboard');
        //     handleSelectedMenu('dashboard');
        // }
    }, []);

    return (
        loading ? <PageWaiting status="waiting" /> :
            <section>
                <Container className="content-page mb-4">
                    {
                        user && <Row>
                            <Col sm={6}>
                                <Row className="mb-3">
                                    <Col>
                                        <h6 className="text-success text-center">Fases dos projetos nos últimos 30 dias</h6>
                                    </Col>
                                </Row>
                                <Row className="justify-content-center align-items-center mb-3">
                                    {
                                        <Col className="text-center">
                                            <span className="text-secondary">Nenhum projeto no período.</span>
                                        </Col>
                                    }
                                </Row>
                            </Col>

                            <Col sm={6}>

                            </Col>
                        </Row>
                    }
                </Container>

                <Container>
                    <Row>
                        <Col className="content-page" sm={4}>
                            <Row>

                            </Row>
                        </Col>
                    </Row>
                </Container>
            </section>
    )
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

    return {
        props: {},
    }
}