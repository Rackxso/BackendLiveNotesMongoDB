import { Ticket } from '../models/ticket.model.js';

export const getAllTicketsAdmin = async (req, res) => {
    try {
        const tickets = await Ticket.find()
            .populate('usuario', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los tickets' });
    }
};

export const deleteTicket = async (req, res) => {
    try {
        const deleted = await Ticket.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Ticket no encontrado' });
        res.status(200).json({ message: 'Ticket eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el ticket' });
    }
};

export const updateEstado = async (req, res) => {
    try {
        const { estado } = req.body;
        if (!['abierto', 'en_revision', 'resuelto'].includes(estado))
            return res.status(400).json({ message: 'Estado inválido' });
        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { estado },
            { new: true }
        ).populate('usuario', 'name email');
        if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });
        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el estado' });
    }
};

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
