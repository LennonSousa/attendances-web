import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Badge, Button, Col, Container, Form, Navbar, Row, Toast } from 'react-bootstrap';
import { FaBell, FaSignOutAlt, FaRegBell, FaRegUserCircle, FaUserTie, FaUserCog } from 'react-icons/fa';

import { AuthContext } from '../../contexts/AuthContext';

import styles from './styles.module.css';

export function Header() {
    const router = useRouter();
    const { signed, user, handleAuthenticated, handleLogout } = useContext(AuthContext);

    const [showPageHeader, setShowPageHeader] = useState(false);

    const pathsNotShow = ['/', '/users/new/auth', '/404', '500'];

    const [showUserDetails, setShowUserDetails] = useState(false);

    const toggleShowUserDetails = () => setShowUserDetails(!showUserDetails);

    useEffect(() => {
        if (!pathsNotShow.find(item => { return item === router.route }))
            handleAuthenticated();
    }, []);

    useEffect(() => {
        let show = false;

        if (signed && !pathsNotShow.find(item => { return item === router.route })) show = true;

        setShowPageHeader(show);
    }, [signed, router.route]);

    function handleRoute(route: string) {
        router.push(route);
    }

    return showPageHeader ? <Navbar bg="dark" variant="dark">
        <Container>
            <Navbar.Brand href="#home">
                <img
                    alt=""
                    src="/assets/images/logo-logica.svg"
                    width="30"
                    height="30"
                    className="d-inline-block align-top"
                />{' '}Plataforma de gerenciamento
            </Navbar.Brand>

            <Form inline>
                <Row>
                    {
                        user && <Col>
                            <Button
                                variant="outline-light"
                                onClick={toggleShowUserDetails}
                                title={user ? user.name : ''}
                            >
                                <FaRegUserCircle />
                            </Button>

                            <Toast
                                show={showUserDetails}
                                onClose={toggleShowUserDetails}
                                autohide
                                delay={5000}
                                style={{
                                    position: 'absolute',
                                    minWidth: '250px',
                                    top: 0,
                                    right: 0,
                                    zIndex: 999,
                                }}
                            >
                                <Toast.Header className="justify-content-center">
                                    <FaUserTie style={{ marginRight: '.5rem' }} /><strong className="me-auto">{user.name}</strong>
                                </Toast.Header>
                                <Toast.Body>
                                    <Row className="mb-3">
                                        <Col>
                                            <Button
                                                variant="light"
                                                type="button"
                                                onClick={() => handleRoute(`/users/details/${user.id}`)}
                                                style={{ width: '100%' }}
                                                title="Ver detalhes do usuário."
                                            >
                                                <FaUserCog style={{ marginRight: '.5rem' }} /> Detalhes
                                            </Button>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col>
                                            <Button
                                                variant="light"
                                                type="button"
                                                onClick={handleLogout}
                                                style={{ width: '100%' }}
                                                title="Sair do sistema."
                                            >
                                                <FaSignOutAlt style={{ marginRight: '.5rem' }} /> Sair
                                            </Button>
                                        </Col>
                                    </Row>
                                </Toast.Body>
                            </Toast>
                        </Col>
                    }
                </Row>
            </Form>
        </Container>
    </Navbar > : <></>
}