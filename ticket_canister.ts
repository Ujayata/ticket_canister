import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

// Class Definitions
class Ticket {
    ticketId: string;
    eventId: string;
    ticketPrice: number;
    expiresAt: Date | string;
}

class Event {
    eventId: string;
    title: string;
    description: string;
    location: Location;
    datetime: Date | string;
    ticketPrice: number;
    createdAt: Date | string;
}

class Location {
    latitude: number;
    longitude: number;
}

// Storage Initialization
const eventsStorage = new StableBTreeMap<string, Event>(0);
const ticketsStorage = new StableBTreeMap<string, Ticket>(0);

// Function to get the current date
const getCurrentDate = () => {
    const timestamp = ic.time();
    return new Date(Number(timestamp) / 1000);
};

// Function to validate if a ticket exists
const validateTicket = (ticketId: string) => {
    const result = ticketsStorage.get(ticketId);
    return !("None" in result);
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
};

export default Server(() => {
    const app = express();
    app.use(express.json());

    // Create event
    app.post("/events", (req, res) => {
        const { title, description, location, datetime, ticketPrice } = req.body;
        if (!title || !description || !location || !datetime || !ticketPrice) {
            return res.status(400).send('Missing required fields');
        }

        const event: Event = {
            eventId: uuidv4(),
            title,
            description,
            location,
            datetime,
            ticketPrice,
            createdAt: getCurrentDate(),
        };

        eventsStorage.insert(event.eventId, event);
        res.json(event);
    });

    // Get all events
    app.get("/events", (req, res) => {
        res.json(eventsStorage.values());
    });

    // Get event by ID
    app.get("/events/:id", (req, res) => {
        const id = req.params.id;
        const result = eventsStorage.get(id);

        if ("None" in result) {
            return res.status(404).send(`The event with id = ${id} not found`);
        }

        res.json(result.Some);
    });

    // Buy ticket with validation
    app.post("/events/ticket/:eventId", (req, res) => {
        const eventId = req.params.eventId;
        const eventResult = eventsStorage.get(eventId);

        if ("None" in eventResult) {
            return res.status(404).send(`Event with id = ${eventId} not found`);
        }

        const event = eventResult.Some;
        if (new Date(event.datetime) < getCurrentDate()) {
            return res.status(400).send("Event has already passed. Ticket cannot be purchased.");
        }

        const ticket: Ticket = {
            ticketId: uuidv4(),
            eventId: eventId,
            expiresAt: event.datetime,
            ticketPrice: event.ticketPrice,
        };

        ticketsStorage.insert(ticket.ticketId, ticket);
        res.json(ticket);
    });

    // Get ticket by ID with validation
    app.get("/events/ticket/:ticketId", (req, res) => {
        const ticketId = req.params.ticketId;

        if (!validateTicket(ticketId)) {
            return res.status(404).send(`Ticket with id = ${ticketId} not found`);
        }

        const ticketResult = ticketsStorage.get(ticketId);
        res.json(ticketResult.Some);
    });

    // Apply error handling middleware
    app.use(errorHandler);

    // Start server and listen for incoming requests
    return app.listen();
});
