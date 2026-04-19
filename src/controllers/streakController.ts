import type { Request, Response } from "express";
import { prisma } from "../utils/prisma.js";

export const calculateStreak = async (req: Request, res: Response) => {
    const userId = req.user.userId
    if (!userId) {
        return res.status(403).json({
            status: "fail",
            message: "userId not found!"
        })
    }
    try {
        await prisma.$transaction(async (tx) => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const yesterday = new Date(today)
            yesterday.setDate(today.getDate() - 1)

            const streak = await tx.streak.findUnique({
                where: {
                    userId: userId
                }
            })
            if (!streak) {
                await tx.streak.create({
                    data: {
                        userId: userId,
                        streak_count: 1,
                        last_updated: today
                    }
                })
                return res.status(200).json({
                    status: "success",
                    data: {
                        streak: 1,
                        lastUpdated: today
                    }
                })
            }
            const last = new Date(streak.last_updated);
            last.setHours(0, 0, 0, 0)

            let newStreak = 1;

            if (last.getTime() === yesterday.getTime()) {
                newStreak = streak.streak_count + 1;
            } else if (last.getTime() === yesterday.getTime()) {
                newStreak = streak.streak_count;
            }

            await tx.streak.update({
                where: { userId: userId },
                data: {
                    streak_count: newStreak,
                    last_updated: today
                }
            })
            return res.status(200).json({
                status: "success",
                data: {
                    streak: newStreak,
                    lastUpdated: today
                }
            })
        })
    } catch (error) {
        return res.status(500).json({
            status: "fail",
            message: error instanceof Error ? error.message : "Something went wrong!"
        })
    }
}