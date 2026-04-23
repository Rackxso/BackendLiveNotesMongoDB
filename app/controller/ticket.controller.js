import { Ticket } from '../models/ticket.model.js';

export const createTicket = async (req, res) => {
    try {
        const userId = req.user.id;
        const { asunto, categoria, descripcion } = req.body;
        const ticket = await Ticket.create({ asunto, categoria, descripcion, usuario: userId });
        res.status(201).json(ticket);
    } catch (error) {
        return res.status(500).json({ message: 'Error al crear el ticket' });
    }
};

export const getTickets = async (req, res) => {
    try {
        const userId = req.user.id;
        const tickets = await Ticket.find({ usuario: userId }).sort({ createdAt: -1 });
        res.status(200).json(tickets);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener los tickets' });
    }
};
