import { useContext } from 'react';
import { useRouter } from 'next/router';
import { Row, Col, ListGroup, Button } from 'react-bootstrap';
import { FaUserEdit, FaUserTag } from 'react-icons/fa';

import { AuthContext } from '../../contexts/AuthContext';
import { can } from '../Users';
import { Shift } from '../Shifts';
import { Attendance } from '../Attendances';

export interface Employee {
    id: string,
    name: string,
    pin: string,
    created_by: string,
    created_at: Date,
    shift: Shift;
    attendances: Attendance[];
}

interface EmployeesProps {
    employee: Employee;
}

const Employees: React.FC<EmployeesProps> = ({ employee }) => {
    const router = useRouter();

    const { user } = useContext(AuthContext)

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <ListGroup.Item variant="light">
            <Row className="align-items-center">
                <Col><span>{employee.name}</span></Col>

                <Col className="col-row"><span>{employee.shift.name}</span></Col>

                <Col className="col-row text-end">
                    <Button
                        variant="outline-success"
                        className="button-link"
                        onClick={() => handleRoute(`/attendances/employees/details/${employee.id}`)}
                        title="Ver informações sobre o funcionário"
                    >
                        <FaUserTag /> Detalhes
                    </Button>
                </Col>

                {
                    user && can(user, "employees", "update:any") ? <Col className="col-row text-end">
                        <Button
                            variant="outline-success"
                            className="button-link"
                            onClick={() => handleRoute(`/attendances/employees/edit/${employee.id}`)}
                            title="Editar funcionário"
                        >
                            <FaUserEdit /> Editar
                        </Button>
                    </Col> : <></>
                }
            </Row>
        </ListGroup.Item>
    )
}

export default Employees;