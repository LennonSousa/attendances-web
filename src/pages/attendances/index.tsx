import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { Button, Col, Container, Form, Modal, Row, Table } from 'react-bootstrap';
import { FaCalendarAlt, FaClock, FaFingerprint, FaToolbox } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format, getDay } from 'date-fns';
import br from 'date-fns/locale/pt-BR';

import api from '../../api/api';
import { TokenVerify } from '../../utils/tokenVerify';
import { SideBarContext } from '../../contexts/SideBarContext';
import { AuthContext } from '../../contexts/AuthContext';
import { can } from '../../components/Users';
import { Employee } from '../../components/Employees';
import { Attendance } from '../../components/Attendances';
import { ShiftDay } from '../../components/ShiftDays';
import { PageWaiting } from '../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../components/interfaces/AlertMessage';
import { dayOfWeekAsInteger } from '../../utils/dayOfWeekAsInteger';
import { convertMinutesToHours } from '../../utils/convertHourToMinutes';

const validationSchema = Yup.object().shape({
    pin: Yup.string().notRequired().max(4, 'Deve conter no máximo 4 caracteres!').min(4, 'No mínimo 4 caracteres').required('Obrigatório!'),
});

export default function Institutions() {
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [pin, setPin] = useState('');

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Verificando...');

    const [employeeToday, setEmployeesToday] = useState<Employee>();
    const [attendancesToday, setAttendancesToday] = useState<Attendance[]>([]);
    const [shiftToday, setShiftToday] = useState<ShiftDay>();
    const [now, setNow] = useState('');

    const [showItem, setShowItem] = useState(false);

    const handleCloseItem = () => setShowItem(false);
    const handelShowItem = () => setShowItem(true);

    const [modalMessageShow, setModalMessageShow] = useState(false);
    const [typeModalMessage, setTypeModalMessage] = useState<statusModal>("waiting");

    useEffect(() => {
        handleItemSideBar('attendances');
        handleSelectedMenu('attendances-index');
    }, []);

    async function handleRegistAttendance() {
        setModalMessageShow(true);
        setTypeModalMessage("waiting");

        try {
            await api.post('employees/attendances', {
                pin,
            });

            handleAudioSuccesfully();

            setTypeModalMessage("success");

            setTimeout(() => {
                setModalMessageShow(false);
                handleCloseItem();
            }, 1500);
        }
        catch {
            handleAudioConnectionError();

            setTypeModalMessage("error");

            setTimeout(() => {
                setModalMessageShow(false);
            }, 4000);
        }
    }

    function handleAudioError() {
        new Audio('/assets/audios/fatal-error-5.mp3').play();
    }

    function handleAudioConnectionError() {
        new Audio('/assets/audios/buzzer-error.mp3').play();
    }

    function handleAudioMessage() {
        new Audio('/assets/audios/minimal-button.mp3').play();
    }

    function handleAudioSuccesfully() {
        new Audio('/assets/audios/successfully-done.mp3').play();
    }

    return !user || loading ? <PageWaiting status="waiting" /> :
        <>
            {
                can(user, "attendances", "create") ? <Container className="content-page">
                    <Formik
                        initialValues={{
                            pin: '',
                        }}
                        onSubmit={async values => {
                            setPin('');

                            setTextLoadingMessage("Verificando...");
                            setTypeMessage("waiting");
                            setMessageShow(true);

                            try {
                                const res = await api.get(`employees/attendances/register?pin=${values.pin}`,
                                    {
                                        validateStatus: function (status) {
                                            return status < 500; // Resolve only if the status code is less than 500
                                        }
                                    });

                                if (res.status !== 200) {
                                    handleAudioError();

                                    setTextLoadingMessage("PIN inválido!");
                                    setTypeMessage("error");

                                    setTimeout(() => {
                                        setMessageShow(false);
                                    }, 4000);

                                    return;
                                }

                                setPin(values.pin);

                                handleAudioMessage();

                                const employeeRes: Employee = res.data.employee;

                                setEmployeesToday(employeeRes);

                                const today = employeeRes.shift.days.find(day => { return day.week_day === getDay(new Date()) });

                                if (today) {
                                    setShiftToday(today);
                                }

                                setNow(format(new Date(res.data.now), 'Pp', { locale: br }));

                                setAttendancesToday(res.data.attendancesToday);
                                handelShowItem();

                                setMessageShow(false);

                                values.pin = '';
                            }
                            catch {
                                handleAudioConnectionError();

                                setTextLoadingMessage("Erro na conexão!");
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
                                <Row className="justify-content-center align-items-center mb-3">
                                    <Col className="col-row">
                                        <span className="text-success"><FaFingerprint size={36} /></span>
                                    </Col>
                                </Row>

                                <Row className="justify-content-center align-items-center mb-3">
                                    <Form.Group className="col-row" as={Col} sm={4} controlId="formGridPin">
                                        <Form.Label>PIN</Form.Label>
                                        <Form.Control
                                            type="password"
                                            maxLength={4}
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

                                <Row className="justify-content-end">
                                    {
                                        messageShow ? <Col sm={3}><AlertMessage
                                            status={typeMessage}
                                            message={textLoadingMessage}
                                        />
                                        </Col> :
                                            <Col className="col-row">
                                                <Button variant="success" type="submit">Registrar</Button>
                                            </Col>
                                    }
                                </Row>
                            </Form>
                        )}
                    </Formik>

                    <Modal show={showItem} onHide={handleCloseItem}>
                        <Modal.Header closeButton>
                            <Modal.Title>Confirmar registro</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {
                                employeeToday && <>
                                    <Row className="align-items-center mb-3 text-center">
                                        <Col>
                                            <h3 className="text-success">{employeeToday.name}</h3>
                                        </Col>
                                    </Row>

                                    <Row className="mt-3 mb-3 text-center">
                                        <Col>
                                            <Row>
                                                <Col>
                                                    <h6 className="text-success">Turno <FaToolbox /></h6>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col>
                                                    <h6 className="text-secondary">{employeeToday.shift.name}</h6>
                                                </Col>
                                            </Row>
                                        </Col>

                                        <Col>
                                            <Row>
                                                <Col>
                                                    <h6 className="text-success">Dia da semana <FaCalendarAlt /></h6>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col>
                                                    {
                                                        shiftToday && <h6 className="text-secondary">{dayOfWeekAsInteger(shiftToday.week_day)}</h6>
                                                    }
                                                </Col>
                                            </Row>
                                        </Col>

                                        <Col>
                                            <Row>
                                                <Col>
                                                    <h6 className="text-success">Horário <FaClock /></h6>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col>
                                                    <h6 className="text-secondary">{now}</h6>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>

                                    <Row className="mt-2 mb-3">
                                        <Col>
                                            <Row>
                                                <Col>
                                                    {
                                                        shiftToday ? <Table striped hover size="sm" responsive>
                                                            <thead>
                                                                <tr>
                                                                    <th >Hora de entrar</th>
                                                                    <th >Hora de sair</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {
                                                                    shiftToday.schedules.map((schedule, index) => {
                                                                        return <tr key={index}>
                                                                            <td>{convertMinutesToHours(schedule.from)}</td>
                                                                            <td>{convertMinutesToHours(schedule.to)}</td>
                                                                        </tr>
                                                                    })
                                                                }
                                                            </tbody>
                                                        </Table> :
                                                            <AlertMessage
                                                                status="warning"
                                                                message="Você não tem nenhum horário registrado para hoje."
                                                            />
                                                    }
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>

                                    <Row className="mt-3">
                                        <Col>
                                            <Row>
                                                <Col>
                                                    <h6 className="text-success">Registros de hoje <FaFingerprint /></h6>
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
                                                                attendancesToday.map((attendance, index) => {
                                                                    return <tr key={index}>
                                                                        <td>{
                                                                            attendance.in && format(new Date(attendance.in_at), 'p', { locale: br })
                                                                        }
                                                                        </td>

                                                                        <td>{
                                                                            attendance.out && format(new Date(attendance.out_at), 'p', { locale: br })
                                                                        }
                                                                        </td>
                                                                    </tr>
                                                                })
                                                            }
                                                        </tbody>
                                                        <caption>{`Registros encontrados: ${attendancesToday.length}`}</caption>
                                                    </Table>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>
                                </>
                            }
                        </Modal.Body>
                        <Modal.Footer>
                            {
                                modalMessageShow ? <AlertMessage status={typeModalMessage} /> :
                                    <>
                                        <Button
                                            variant="outline-secondary"
                                            type="button"
                                            onClick={handleCloseItem}
                                        >
                                            Cancelar
                                        </Button>

                                        <Button
                                            variant="success"
                                            type="button"
                                            onClick={handleRegistAttendance}
                                        >
                                            Confirmar
                                        </Button>
                                    </>
                            }
                        </Modal.Footer>
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