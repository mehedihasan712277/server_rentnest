import { Role } from "../../../generated/prisma/enums";

export interface RegisterUserPayload {
    name: string;
    email: string;
    password: string;
    profilePhoto: string;
    role: Role;
    key?: string;
}
