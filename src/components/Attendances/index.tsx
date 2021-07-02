import { Employee } from '../Employees';

export interface Attendance {
    id: string,
    in: boolean,
    in_at: Date,
    out: boolean,
    out_at: Date;
    employee: Employee,
}