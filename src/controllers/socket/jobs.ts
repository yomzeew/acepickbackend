import { Server, Socket } from "socket.io";
import { JobStatus, UserRole } from "../../utils/enum";
import prisma from "../../config/prisma";

export const emitLatestJob = async (io: Server, socket: Socket) => {
    const { id, role } = socket.user;

    if (role === UserRole.PROFESSIONAL) {
        try {
            const job = await prisma.job.findFirst({
                where: {
                    professionalId: id,
                    status: JobStatus.PENDING as any,
                    accepted: false
                },
                orderBy: { createdAt: 'desc' },
                include: { materials: true }
            })

            if (job) {
                io.to(socket.id).emit('JOB_LATEST', { text: 'You have a pending job', data: job });
            }
        } catch (error) {
            console.log(error);
        }
    }
}
