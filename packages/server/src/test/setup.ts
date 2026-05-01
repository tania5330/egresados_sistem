import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>();

export const mockPrismaService = () => prismaMock;