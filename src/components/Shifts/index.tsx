import { useContext } from 'react';
import { useRouter } from 'next/router';
import { Row, Col, ListGroup, Button } from 'react-bootstrap';
import { FaUserEdit, FaUserTag } from 'react-icons/fa';

import { AuthContext } from '../../contexts/AuthContext';
import { can } from '../Users';
import { ShiftDay } from '../ShiftDays';

export interface Shift {
    id: string,
    name: string;
    tolerance: number;
    days: ShiftDay[];
}

interface ShiftsProps {
    shift: Shift;
    handleListShifts(): Promise<void>;
}

const Shifts: React.FC<ShiftsProps> = ({ shift, handleListShifts }) => {
    const router = useRouter();

    const { user } = useContext(AuthContext)

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <ListGroup.Item variant="secondary">
            <Row className="align-items-center">
                <Col><span>{shift.name}</span></Col>

                <Col className="col-row text-end">
                    <Button
                        variant="outline-success"
                        className="button-link"
                        onClick={() => handleRoute(`/shifts/details/${shift.id}`)}
                        title="Ver informações sobre o turno"
                    >
                        <FaUserTag /> Detalhes
                    </Button>
                </Col>

                {
                    user && can(user, "shifts", "update:any") ? <Col className="col-row text-end">
                        <Button
                            variant="outline-success"
                            className="button-link"
                            onClick={() => handleRoute(`/shifts/edit/${shift.id}`)}
                            title="Editar turno"
                        >
                            <FaUserEdit /> Editar
                        </Button>
                    </Col> : <></>
                }
            </Row>
        </ListGroup.Item>
    )
}

export default Shifts;