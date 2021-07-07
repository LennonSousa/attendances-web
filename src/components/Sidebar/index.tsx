import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Accordion, Card, Dropdown, Nav, NavDropdown, Row, Col } from 'react-bootstrap';
import {
    FaColumns,
    FaToolbox,
    FaReceipt,
    FaIdCardAlt,
    FaClock,
    FaList,
    FaPlus,
    FaUsers,
    FaUsersCog,
    FaUserClock
} from 'react-icons/fa';

import { SideBarContext } from '../../contexts/SideBarContext';
import { AuthContext } from '../../contexts/AuthContext';
import { can } from '../../components/Users';

import styles from './styles.module.css';

const Sidebar: React.FC = () => {
    const router = useRouter();
    const { itemSideBar, selectedMenu, handleItemSideBar } = useContext(SideBarContext);
    const { signed, user } = useContext(AuthContext);

    const [showPageHeader, setShowPageHeader] = useState(false);

    const pathsNotShow = ['/', '/users/new/auth', '/404', '500'];

    useEffect(() => {
        let show = false;

        if (signed && user) {
            if (!pathsNotShow.find(item => { return item === router.route })) show = true;
        }

        setShowPageHeader(show);
    }, [signed, router.route, user]);

    function handleToDashboard() {
        router.push('/dashboard');
    }

    return (
        showPageHeader && user ? <div className={styles.sideBarContainer}>
            <Accordion activeKey={itemSideBar} className={styles.accordionContainer}>
                {/* <Card className={styles.menuCard}>
                    <Accordion.Toggle
                        as={Card.Header}
                        className={styles.menuCardHeader}
                        eventKey="dashboard"
                        onClick={handleToDashboard}
                    >
                        <div>
                            <FaColumns /> <span>Painel</span>
                        </div>
                    </Accordion.Toggle>
                </Card> */}

                {
                    can(user, "attendances", "read:any") && <Card className={styles.menuCard}>
                        <Accordion.Toggle
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="attendances"
                            onClick={() => handleItemSideBar('attendances')}
                        >
                            <div>
                                <FaClock /> <span>Ponto</span>
                            </div>
                        </Accordion.Toggle>

                        <Accordion.Collapse eventKey="attendances">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/attendances">
                                    <a title="Registro de entrada e saída" data-title="Registro de entrada e saída">
                                        <Row
                                            className={
                                                selectedMenu === 'attendances-index' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaReceipt size={14} />
                                            </Col>
                                            <Col>
                                                <span>Registrar</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                <Dropdown.Divider />

                                {
                                    can(user, "employees", "read:any") && <Link href="/attendances/employees">
                                        <a title="Listar todos os funcionários" data-title="Listar todos os funcionários">
                                            <Row
                                                className={
                                                    selectedMenu === 'employees-index' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaIdCardAlt size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Funcionários</span>
                                                </Col>
                                            </Row>
                                        </a>
                                    </Link>
                                }

                                {
                                    can(user, "shifts", "read:any") && <>
                                        <Link href="/attendances/shifts">
                                            <a title="Listar os turnos" data-title="Listar os turnos">
                                                <Row
                                                    className={
                                                        selectedMenu === 'shifts-index' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaToolbox size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Turnos</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>
                                    </>
                                }

                                <Link href="/attendances/reports">
                                    <a title="Relatórios de entradas e saídas" data-title="Relatórios de entradas e saídas">
                                        <Row
                                            className={
                                                selectedMenu === 'attendances-reports' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaUserClock size={14} />
                                            </Col>
                                            <Col>
                                                <span>Relatórios</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }

                {
                    can(user, "users", "read:any") && <Card className={styles.menuCard}>
                        <Accordion.Toggle
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="users"
                            onClick={() => handleItemSideBar('users')}
                        >
                            <div>
                                <FaUsers /> <span>Usuários</span>
                            </div>
                        </Accordion.Toggle>
                        <Accordion.Collapse eventKey="users">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/users">
                                    <a title="Listar todos os usuários" data-title="Listar todos os usuários">
                                        <Row
                                            className={
                                                selectedMenu === 'users-index' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaList size={14} />
                                            </Col>
                                            <Col>
                                                <span>Lista</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                {
                                    can(user, "users", "create") && <Link href="/users/new">
                                        <a title="Criar um novo usuário" data-title="Criar um novo usuário">
                                            <Row
                                                className={
                                                    selectedMenu === 'users-new' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaPlus size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Novo</span>
                                                </Col>
                                            </Row>
                                        </a>
                                    </Link>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }
            </Accordion>
        </div > : null
    )
}

export function SideNavBar() {
    const { user } = useContext(AuthContext);

    return (
        user ? <Nav className="me-auto mb-3">
            {
                can(user, "attendances", "read:any") && <NavDropdown title="Ponto" id="attendances-dropdown">
                    {
                        can(user, "attendances", "create") && <Link href="/attendances" passHref>
                            <NavDropdown.Item ><FaReceipt size={14} /> Registrar</NavDropdown.Item>
                        </Link>
                    }

                    <NavDropdown.Divider />

                    {
                        can(user, "employees", "read:any") && <Link href="/attendances/employees" passHref>
                            <NavDropdown.Item ><FaIdCardAlt size={14} /> Funcionários</NavDropdown.Item>
                        </Link>
                    }

                    {
                        can(user, "shifts", "read:any") && <Link href="/attendances/shifts" passHref>
                            <NavDropdown.Item ><FaToolbox size={14} /> Turnos</NavDropdown.Item>
                        </Link>
                    }
                </NavDropdown>


            }

            {
                can(user, "users", "read:any") && <NavDropdown title="Usuários" id="users-dropdown">
                    {
                        can(user, "users", "create") && <Link href="/users" passHref>
                            <NavDropdown.Item ><FaList size={14} /> Lista</NavDropdown.Item>
                        </Link>
                    }

                    <NavDropdown.Divider />

                    {
                        can(user, "users", "read:any") && <Link href="/users/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Novo</NavDropdown.Item>
                        </Link>
                    }
                </NavDropdown>
            }
        </Nav> : <></>
    )
}

export default Sidebar;