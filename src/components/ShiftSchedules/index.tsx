import { useState } from 'react';
import { Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { FaTrashAlt, FaCheck, FaSave } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { ShiftDay } from '../ShiftDays';
import { convertHourToMinutes, convertMinutesToHours } from '../../utils/convertHourToMinutes';

import styles from './styles.module.css';

export interface ShiftSchedule {
    id: string;
    from: number;
    to: number;
    day: ShiftDay;
}

interface ShiftSchedulesProps {
    schedule: ShiftSchedule;
    handleListSchedules(): Promise<void>;
}

type savingStatus = "saved" | "touched" | "saving";

const validationSchema = Yup.object().shape({
    from: Yup.string().required('Obrigatório!'),
    to: Yup.string().required('Obrigatório'),
});

const ShiftSchedules: React.FC<ShiftSchedulesProps> = ({ schedule, handleListSchedules }) => {
    const [fieldsFormTouched, setFieldsFormTouched] = useState(false);
    const [savingScheduleStatus, setSavingScheduleStatus] = useState<savingStatus>("saved");
    const [waitingDelete, setWaitingDelete] = useState(false);

    async function deleteSchedule() {
        setWaitingDelete(true);

        try {
            await api.delete(`attendances/shifts/schedules/${schedule.id}`);

            handleListSchedules();
        }
        catch (err) {
            console.log("Error to delete schedule");
            console.log(err);

            setWaitingDelete(false);
        }
    }

    return (
        <Col className={styles.containerSchedule} md={2}>
            <Formik
                initialValues={{
                    from: convertMinutesToHours(schedule.from),
                    to: convertMinutesToHours(schedule.to),
                }}

                onSubmit={async values => {
                    setFieldsFormTouched(false);

                    setSavingScheduleStatus("saving");

                    try {
                        await api.put(`attendances/shifts/schedules/${schedule.id}`, {
                            from: convertHourToMinutes(values.from),
                            to: convertHourToMinutes(values.to),
                        });

                        handleListSchedules();
                    }
                    catch (err) {
                        console.log('error to update schedules day');
                        console.log(err);
                    }

                    setSavingScheduleStatus("saved");
                }}
                validationSchema={validationSchema}
            >
                {({ handleSubmit, values, setFieldValue, errors }) => (
                    <Form onSubmit={handleSubmit}>
                        <Form.Group as={Row} className="justify-content-center text-center" controlId={"formHours" + schedule.id + "from"}>
                            <Form.Label column className="col-md-3 col-4">De</Form.Label>
                            <Col className="col-md-9 col-8">
                                <Form.Control
                                    type="time"
                                    placeholder="Ex: R$ 14:00"
                                    onChange={(e) => { setFieldValue('from', e.target.value, true); setFieldsFormTouched(true); setSavingScheduleStatus("touched"); }}
                                    defaultValue={values.from}
                                    name="from"
                                    isInvalid={!!errors.from}
                                />
                                <Form.Control.Feedback type="invalid">{errors.from}</Form.Control.Feedback>
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} className="justify-content-center text-center" controlId={"formHours" + schedule.id + "to"}>
                            <Form.Label column className="col-md-3 col-4">Até</Form.Label>
                            <Col className="col-md-9 col-8">
                                <Form.Control
                                    type="time"
                                    placeholder="Ex: R$ 14:00"
                                    onChange={(e) => { setFieldValue('to', e.target.value, true); setFieldsFormTouched(true); setSavingScheduleStatus("touched"); }}
                                    defaultValue={values.to}
                                    name="to"
                                    isInvalid={!!errors.to}
                                />
                                <Form.Control.Feedback type="invalid">{errors.to}</Form.Control.Feedback>
                            </Col>
                        </Form.Group>

                        <Form.Row className="justify-content-center">
                            <Col className="col-4">
                                <Button variant="outline-danger" onClick={deleteSchedule}>
                                    {
                                        waitingDelete ? <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                        /> : <FaTrashAlt />
                                    }
                                </Button>
                            </Col>
                            <Col className="col-4">
                                <Button variant="outline-success" disabled={!fieldsFormTouched} type="submit" >
                                    {
                                        savingScheduleStatus === "saving" ? <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                        /> : (
                                            savingScheduleStatus === "saved" ? <FaCheck /> : savingScheduleStatus === "touched" && <FaSave />
                                        )
                                    }
                                </Button>
                            </Col>
                        </Form.Row>
                    </Form>
                )}
            </Formik>
        </Col>
    )
}

export default ShiftSchedules;