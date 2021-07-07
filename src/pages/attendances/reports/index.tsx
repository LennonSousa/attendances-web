import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format, formatISO, startOfDay, endOfDay } from 'date-fns';
import br from 'date-fns/locale/pt-BR';
import { FaPrint } from 'react-icons/fa';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import { Attendance } from '../../../components/Attendances';
import { Employee } from '../../../components/Employees';
import ReportsItem, { DataTable } from '../../../components/Reports';
import { PageWaiting } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/interfaces/AlertMessage';
import { convertHourToMinutes, convertMinutesToHours } from '../../../utils/convertHourToMinutes';

const validationSchema = Yup.object().shape({
    start: Yup.date().required('Obrigatório!'),
    end: Yup.date().required('Obrigatório!'),
    employee: Yup.string().required('Obrigatório!'),
});

const timeZone = "America/Fortaleza";

interface AttendanceTableProps {
    employee: Employee,
    dataTable: DataTable[],
}

export default function Reports() {
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [isFirstView, setIsFirstView] = useState(true);
    const [showResultMessage, setShowResultMessage] = useState(false);

    const [employees, setEmployees] = useState<Employee[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<statusModal>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Carregando...');

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [filterStart, setFilterStart] = useState(format(new Date(), 'P', { locale: br }));
    const [filterEnd, setFilterEnd] = useState(format(new Date(), 'P', { locale: br }));

    const [tableData, setTableData] = useState<AttendanceTableProps[]>([]);

    const tableHeader = [
        "Dia",
        "Entrada",
        "Saída",
        "Total",
    ];

    useEffect(() => {
        handleItemSideBar('attendances');
        handleSelectedMenu('attendances-reports');

        if (user && can(user, "attendances", "read:any")) {
            api.get('/employees').then(res => {
                setEmployees(res.data);

                setLoadingData(false);
            }).catch(err => {
                console.log('Error to get employees on reports, ', err);

                setTypeLoadingMessage("error");
                setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                setHasErrors(true);
            });
        }
    }, [user]);

    return (
        <>
            <NextSeo
                title="Relatório de entradas e saídas"
                description="Relatórios de entradas e saídas da plataforma de gerenciamento da Lógica renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Relatório de entradas e saídas',
                    description: 'Relatório de entradas e saídas da plataforma de gerenciamento da Lógica renovaveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Relatório de entradas e saídas | Plataforma Lógica',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "attendances", "read:any") ? loadingData || hasErrors ? <PageWaiting
                                status={typeLoadingMessage}
                                message={textLoadingMessage}
                            /> :
                                <>
                                    {
                                        <Container className="content-page">
                                            <Row className="mb-3 d-print-none">
                                                <Col>
                                                    <Row>
                                                        <Col>
                                                            <h6 className="text-success">Selecione os itens para gerar o relatório.</h6>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                            </Row>

                                            <Row className="mb-3 d-print-none">
                                                <Col>
                                                    <Formik
                                                        initialValues={
                                                            {
                                                                start: format(new Date(), 'yyyy-MM-dd'),
                                                                end: format(new Date(), 'yyyy-MM-dd'),
                                                                employee: 'all',
                                                            }
                                                        }
                                                        onSubmit={async values => {
                                                            setShowResultMessage(false);
                                                            setIsFirstView(false);
                                                            setTypeMessage("waiting");
                                                            setMessageShow(true);

                                                            try {
                                                                const start = format(new Date(`${values.start} 00:00:00`), 'yyyy-MM-dd HH:mm:ss');
                                                                const end = format(new Date(`${values.end} 23:59:59`), 'yyyy-MM-dd HH:mm:ss');

                                                                setFilterStart(format(new Date(start), 'P', { locale: br }));
                                                                setFilterEnd(format(new Date(end), 'P', { locale: br }));

                                                                const employee = values.employee === 'all' ? '' : `&employee=${values.employee}`;

                                                                const res = await api.get(`employees/attendances?start=${start}&end=${end}${employee}`);

                                                                let dataTableItems: AttendanceTableProps[] = [];

                                                                const attendancesRes: Attendance[] = res.data;

                                                                employees.forEach(employee => {
                                                                    const attendanceItems = attendancesRes.filter(attendance => {
                                                                        return attendance.employee.id === employee.id
                                                                    });

                                                                    if (!!attendanceItems.length) {
                                                                        let totalHours = 0;

                                                                        let dataRes = attendanceItems.map(attendance => {
                                                                            let totalHoursOnAttendance = '';

                                                                            try {
                                                                                if (attendance.in && attendance.out) {
                                                                                    const minutesIn = convertHourToMinutes(format(new Date(attendance.in_at), 'p', { locale: br }));
                                                                                    const minutesOut = convertHourToMinutes(format(new Date(attendance.out_at), 'p', { locale: br }));

                                                                                    const minutesOnAttendance = minutesOut - minutesIn;

                                                                                    totalHours += minutesOnAttendance;

                                                                                    totalHoursOnAttendance = convertMinutesToHours(minutesOnAttendance);
                                                                                }
                                                                            }
                                                                            catch { }

                                                                            return {
                                                                                link: '',
                                                                                item: [
                                                                                    format(new Date(attendance.in_at), 'P', { locale: br }),
                                                                                    attendance.in ? format(new Date(attendance.in_at), 'p', { locale: br }) : '',
                                                                                    attendance.out ? format(new Date(attendance.out_at), 'p', { locale: br }) : '',
                                                                                    totalHoursOnAttendance,
                                                                                ]
                                                                            }
                                                                        });

                                                                        dataRes.push({
                                                                            link: '',
                                                                            item: [
                                                                                "Total",
                                                                                "",
                                                                                "",
                                                                                convertMinutesToHours(totalHours),
                                                                            ]
                                                                        });

                                                                        dataTableItems.push({
                                                                            employee: attendanceItems[0].employee,
                                                                            dataTable: dataRes,
                                                                        });
                                                                    }
                                                                });

                                                                if (!!!res.data.length) setShowResultMessage(true);

                                                                setTableData(dataTableItems);

                                                                setMessageShow(false);
                                                            }
                                                            catch (err) {
                                                                setTypeMessage("error");

                                                                setTimeout(() => {
                                                                    setMessageShow(false);
                                                                }, 4000);

                                                                console.log('error create institution.');
                                                                console.log(err);
                                                            }

                                                        }}
                                                        validationSchema={validationSchema}
                                                    >
                                                        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                                                            <Form onSubmit={handleSubmit}>
                                                                <Row className="mb-3 align-items-end">
                                                                    <Form.Group as={Col} sm={3} controlId="formGridStartDate">
                                                                        <Form.Label>De</Form.Label>
                                                                        <Form.Control
                                                                            type="date"
                                                                            placeholder="Data de início"
                                                                            onChange={handleChange}
                                                                            value={values.start}
                                                                            name="start"
                                                                        />
                                                                    </Form.Group>

                                                                    <Form.Group as={Col} sm={3} controlId="formGridEndtDate">
                                                                        <Form.Label>Até</Form.Label>
                                                                        <Form.Control
                                                                            type="date"
                                                                            placeholder="Data de término"
                                                                            onChange={handleChange}
                                                                            value={values.end}
                                                                            name="end"
                                                                        />
                                                                    </Form.Group>

                                                                    <Form.Group as={Col} sm={4} controlId="formGridLine">
                                                                        <Form.Label>Funcionário</Form.Label>
                                                                        <Form.Control
                                                                            as="select"
                                                                            onChange={handleChange}
                                                                            onBlur={handleBlur}
                                                                            value={values.employee}
                                                                            name="employee"
                                                                            isInvalid={!!errors.employee && touched.employee}
                                                                        >
                                                                            <option value="all">Todos</option>
                                                                            {
                                                                                employees.map((employee, index) => {
                                                                                    return <option key={index} value={employee.id}>{employee.name}</option>
                                                                                })
                                                                            }
                                                                        </Form.Control>
                                                                        <Form.Control.Feedback type="invalid">{touched.employee && errors.employee}</Form.Control.Feedback>
                                                                    </Form.Group>

                                                                    <Form.Group as={Col} className="col-row" controlId="formGridButton">
                                                                        {
                                                                            messageShow ? <AlertMessage status={typeMessage} /> :
                                                                                <Button variant="outline-success" type="submit">Consultar</Button>
                                                                        }
                                                                    </Form.Group>
                                                                </Row>
                                                            </Form>
                                                        )}
                                                    </Formik>
                                                </Col>
                                            </Row>

                                            {
                                                isFirstView ? <AlertMessage status="success" message="Configure os items acima para fazer a pesquisa." /> :
                                                    !!!tableData.length && showResultMessage ? <AlertMessage status="warning" message="A pesquisa não retornou nenhum resultado." /> :
                                                        <>
                                                            <Row className="mb-3">
                                                                <Col>
                                                                    <Row>
                                                                        <Col>
                                                                            <h5 className="text-success">Relatório de entradas e saídas.</h5>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Col>
                                                                            <h6 className="text-secondary">{`De ${filterStart} - ${filterEnd}`}</h6>
                                                                        </Col>
                                                                    </Row>
                                                                </Col>
                                                            </Row>

                                                            {
                                                                tableData.map((data, index) => {
                                                                    return <Row key={index} className="mb-3">
                                                                        <Col>
                                                                            <Row>
                                                                                <Col>
                                                                                    <h5 className="text-success">{data.employee.name}</h5>
                                                                                </Col>
                                                                            </Row>

                                                                            <Row>
                                                                                <Col>
                                                                                    <ReportsItem
                                                                                        header={tableHeader}
                                                                                        data={data.dataTable}
                                                                                        showLink={false}
                                                                                    />
                                                                                </Col>
                                                                            </Row>
                                                                        </Col>
                                                                    </Row>
                                                                })
                                                            }

                                                            <Row className="mb-3 justify-content-end d-print-none">
                                                                <Col className="col-row">
                                                                    <Button
                                                                        variant="outline-success"
                                                                        onClick={() => window.print()}
                                                                    >
                                                                        <FaPrint /> Imprimir
                                                                    </Button>
                                                                </Col>
                                                            </Row>
                                                        </>
                                            }
                                        </Container>
                                    }
                                </> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { token } = context.req.cookies;

    const tokenVerified = await TokenVerify(token);

    if (tokenVerified === "not-authorized") { // Not authenticated, token invalid!
        return {
            redirect: {
                destination: `/?returnto=${context.req.url}`,
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