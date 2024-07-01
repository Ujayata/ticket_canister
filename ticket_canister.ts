import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';



class Ticket {
	ticketId: string
	eventId: string;
	ticketPrice: number;
	expiresAt: Date;
}

class Event {
	eventId: string;
	title: string;
	description: string;
	location: Location;
	datetime: Date;
	ticketPrice: number;
	createdAt: Date;
}

class Location {
	latitude: number;
	longitude: number;
}

const eventsStorage = StableBTreeMap<string, Event>(0);
const ticketsStorage = StableBTreeMap<string, Ticket>(0);


export default Server(() => {
	const app = express();
	app.use(express.json());


	// create event
	app.post("/events", (req, res) => {
		const event: Event = {eventId: uuidv4(),  createdAt: getCurrentDate(), ...req.body };

		eventsStorage.insert(event.eventId, event);

		res.json(event);
	})

	// get all events
	app.get("/events", (req, res) => {
		res.json(eventsStorage.values());
	});


	// get event by id
	app.get("/events/:id", (req, res) => {
		const id = req.params.id;
		const result = eventsStorage.get(id);

		if ("None" in result) {
			res.status(404).send(`the event with id = ${id} not found`);
			return;
		}

		res.json(result.Some);
	});


	// buy ticket
	app.post("/events/ticket/:eventId", (req, res) => {
		const id = req.params.eventId;
		const result = eventsStorage.get(id);

		if ("None" in result) {
			res.status(404).send(`the event with id = ${id} not found`);
			return;
		}


		const ticket: Ticket = {ticketId: uuidv4(), eventId: id, expiresAt: result.Some.datetime, ticketPrice: result.Some.ticketPrice};
		
		
		ticketsStorage.insert(ticket.ticketId, ticket);

		res.json(ticket);

	});

	// get ticket
	app.get("/events/ticket/:ticketId", (req, res) => {
		const id = req.params.ticketId;
		const result = eventsStorage.get(id);

		if ("None" in result) {
			res.status(404).send(`ticket with id = ${id} not found`);
			return;
		}

		res.json(result.Some);

	});


	// start server and listen for incoming requests
	return app.listen();
});


const getCurrentDate = () => {
	const timestamp = new Number(ic.time());

	return new Date(timestamp.valueOf() / 1000_000);
}
