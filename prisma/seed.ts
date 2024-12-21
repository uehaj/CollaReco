/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    // const sessions = await prisma.session.createMany({
    //     data: [
    //         { name: 'Session 1' },
    //         { name: 'Session 2' },
    //         { name: 'Session 3' },
    //     ],
    // });
    // console.log(`sessions = `, sessions)
    // // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    // const users = await prisma.user.createMany({
    //     data: [
    //         { name: 'User 1' },
    //         { name: 'User 2' },
    //         { name: 'User 3' },
    //     ],
    // });
    // console.log(`users = `, users)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await prisma.message.createMany({
        data: [{
            text: 'Text 1',
            session: { create: { "name": "session" } },
            user: { create: { "name": "anonymous1" } }
        }],

    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    .finally(async () => {
        await prisma.$disconnect();
    });
