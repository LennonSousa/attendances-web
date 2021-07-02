import { Row, Col, Button } from 'react-bootstrap';
import { FaPlus, FaTrashAlt } from "react-icons/fa";

import api from '../../api/api';
import { Shift } from '../Shifts';
import Schedule, { ShiftSchedule } from '../ShiftSchedules';
import { dayOfWeekAsInteger } from '../../utils/dayOfWeekAsInteger';

import styles from './styles.module.css';

export interface ShiftDay {
    id: string,
    week_day: number,
    shift: Shift,
    schedules: ShiftSchedule[]
}

interface ShiftDaysProps {
    day: ShiftDay;
    canEdit?: boolean;
    handleListDays?: () => Promise<void>;
}

const ShiftDays: React.FC<ShiftDaysProps> = ({ day, canEdit = true, handleListDays }) => {
    async function addDaySchedule() {
        try {
            await api.post('attendances/shifts/schedules', {
                from: 0,
                to: 0,
                day: day.id
            });

            handleListDays && handleListDays();
        }
        catch (err) {
            console.log('error post schedule day');
            console.log(err);
        }
    }

    async function deleteShiftDay() {
        try {
            await api.delete(`attendances/shifts/days/${day.id}`);

            handleListDays && handleListDays();
        }
        catch (err) {
            console.log('error to delete schedule day');
            console.log(err);
        }
    }

    async function handleListSchedules() {
        handleListDays && handleListDays();
    }

    return (
        <Row className={styles.containerDay}>
            <Col className="mt-3 mb-3" md={2}>
                <Row className="justify-content-center text-center">
                    <Col className="col-12 mt-2 mb-2 text-success">
                        <h6>{dayOfWeekAsInteger(day.week_day)}</h6>
                    </Col>
                </Row>

                {
                    canEdit && <>
                        <Row className="justify-content-center text-center mb-3">
                            <Col>
                                <Button variant="outline-danger" onClick={addDaySchedule} ><FaPlus /> Horário</Button>
                            </Col>
                        </Row>

                        <Row className="justify-content-center text-center">
                            <Col>
                                <Button variant="outline-danger" onClick={deleteShiftDay} ><FaTrashAlt /> Excluir</Button>
                            </Col>
                        </Row>
                    </>
                }
            </Col>

            {
                day.schedules && day.schedules.map(schedule => {
                    return <Schedule
                        key={schedule.id}
                        schedule={schedule}
                        canEdit={canEdit}
                        handleListSchedules={handleListSchedules}
                    />
                })
            }
        </Row>
    )
}

export default ShiftDays;