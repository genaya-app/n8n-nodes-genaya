import type {
	ILoadOptionsFunctions,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeConnectionTypes } from 'n8n-workflow';

import { genayaApiRequest } from './GenericFunctions';

// Declarative node over the Genaya public API (https://api.genaya.com/v1).
// The /v1 envelope is { data: <object> } for single records and
// { object: "list", data: [...] } for lists, so every operation post-receives
// rootProperty "data".

const unwrapData = {
	postReceive: [
		{
			type: 'rootProperty' as const,
			properties: { property: 'data' },
		},
	],
};

const limitField: INodeProperties = {
	displayName: 'Limit',
	name: 'limit',
	type: 'number',
	typeOptions: { minValue: 1, maxValue: 100 },
	default: 25,
	description: 'Max number of results to return',
	displayOptions: { show: { operation: ['getMany'] } },
	routing: { send: { type: 'query', property: 'limit' } },
};

const idField: INodeProperties = {
	displayName: 'Record ID',
	name: 'id',
	type: 'string',
	required: true,
	default: '',
	description: 'The Genaya record ID (the "id" field returned by the API)',
	displayOptions: { show: { operation: ['get'] } },
};

const leadTableField: INodeProperties = {
	displayName: 'Lead Table Name or ID',
	name: 'tableId',
	type: 'options',
	typeOptions: { loadOptionsMethod: 'getLeadTables' },
	required: true,
	default: '',
	description:
		'The lead table to operate on. Choose from the list, or specify an ID using an expression.',
	displayOptions: { show: { resource: ['lead'] } },
};

export class Genaya implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Genaya',
		name: 'genaya',
		icon: 'file:genaya.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Work with clients, leads, appointments, invoices, tasks and messages in Genaya',
		defaults: { name: 'Genaya' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'genayaApi', required: true }],
		requestDefaults: {
			baseURL: 'https://api.genaya.com/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Appointment', value: 'appointment' },
					{ name: 'Client', value: 'client' },
					{ name: 'Invoice', value: 'invoice' },
					{ name: 'Lead', value: 'lead' },
					{ name: 'Message', value: 'message' },
					{ name: 'Task', value: 'task' },
				],
				default: 'client',
			},

			// ---------------- Client ----------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['client'] } },
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a client',
						routing: {
							request: { method: 'POST', url: '/clients' },
							output: unwrapData,
						},
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a client',
						routing: {
							request: { method: 'GET', url: '=/clients/{{$parameter.id}}' },
							output: unwrapData,
						},
					},
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many clients',
						routing: {
							request: { method: 'GET', url: '/clients' },
							output: unwrapData,
						},
					},
				],
				default: 'getMany',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['client'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'firstName' } },
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['client'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'lastName' } },
			},
			{
				displayName: 'Company',
				name: 'company',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['client'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'company' } },
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				displayOptions: { show: { resource: ['client'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'email' } },
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'E.164 format preferred, for example +14155550142',
				displayOptions: { show: { resource: ['client'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'phone' } },
			},
			{
				displayName: 'Lead Source',
				name: 'leadSource',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['client'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'leadSource' } },
			},

			// ---------------- Lead ----------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['lead'] } },
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a lead',
						routing: {
							request: {
								method: 'POST',
								url: '=/lead-tables/{{$parameter.tableId}}/leads',
							},
							output: unwrapData,
						},
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a lead',
						routing: {
							request: {
								method: 'GET',
								url: '=/lead-tables/{{$parameter.tableId}}/leads/{{$parameter.id}}',
							},
							output: unwrapData,
						},
					},
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many leads',
						routing: {
							request: {
								method: 'GET',
								url: '=/lead-tables/{{$parameter.tableId}}/leads',
							},
							output: unwrapData,
						},
					},
				],
				default: 'getMany',
			},
			leadTableField,
			{
				displayName: 'Fields (JSON)',
				name: 'fieldsJson',
				type: 'json',
				default: '{\n  "firstName": "",\n  "lastName": "",\n  "email": "",\n  "phone": ""\n}',
				description:
					'Row cell values keyed by each column\'s nameId (GET /v1/lead-tables/{ID} -> tabs[].columns[].nameId)',
				displayOptions: { show: { resource: ['lead'], operation: ['create'] } },
				routing: {
					send: {
						type: 'body',
						property: 'fields',
						value:
							'={{ typeof $value === "string" ? JSON.parse($value || "{}") : $value }}',
					},
				},
			},

			// ---------------- Appointment ----------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['appointment'] } },
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create an appointment',
						routing: {
							request: { method: 'POST', url: '/appointments' },
							output: unwrapData,
						},
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get an appointment',
						routing: {
							request: { method: 'GET', url: '=/appointments/{{$parameter.id}}' },
							output: unwrapData,
						},
					},
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many appointments',
						routing: {
							request: { method: 'GET', url: '/appointments' },
							output: unwrapData,
						},
					},
				],
				default: 'getMany',
			},
			{
				displayName: 'Client First Name',
				name: 'apptFirstName',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'firstName' } },
			},
			{
				displayName: 'Client Last Name',
				name: 'apptLastName',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'lastName' } },
			},
			{
				displayName: 'Client Phone',
				name: 'apptPhone',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'phone' } },
			},
			{
				displayName: 'Client Email',
				name: 'apptEmail',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'email' } },
			},
			{
				displayName: 'Appointment Type',
				name: 'appointmentType',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'appointmentType' } },
			},
			{
				displayName: 'Start',
				name: 'startAt',
				type: 'string',
				default: '',
				placeholder: '2026-08-10 09:00:00',
				description:
					"Start time, interpreted in the organization's local time (ISO or YYYY-MM-DD HH:mm:ss)",
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'startAt' } },
			},
			{
				displayName: 'End',
				name: 'endAt',
				type: 'string',
				default: '',
				placeholder: '2026-08-10 10:00:00',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'endAt' } },
			},
			{
				displayName: 'Description',
				name: 'apptDescription',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'description' } },
			},
			{
				displayName: 'Status',
				name: 'apptStatus',
				type: 'options',
				options: [
					{ name: 'Canceled', value: 'Canceled' },
					{ name: 'Done', value: 'Done' },
					{ name: 'Estimate', value: 'Estimate' },
					{ name: 'In Progress', value: 'In Progress' },
					{ name: 'Pending', value: 'Pending' },
					{ name: 'Submitted', value: 'Submitted' },
				],
				default: 'Submitted',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'status' } },
			},
			{
				displayName: 'Total',
				name: 'apptTotal',
				type: 'number',
				default: 0,
				description: 'Grand total (tax-inclusive) of an appointment without line items - a quoted price. Genaya splits the tax back out when the appointment carries a tax rate; the balance follows the total. Leave 0 to skip.',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'total', value: '={{ $value || undefined }}' } },
			},
			{
				displayName: 'Subtotal',
				name: 'apptSubtotal',
				type: 'number',
				default: 0,
				description: 'Subtotal before tax. Send it with Tax Total to set both exactly. Leave 0 to skip.',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'subtotal', value: '={{ $value || undefined }}' } },
			},
			{
				displayName: 'Tax Total',
				name: 'apptTaxTotal',
				type: 'number',
				default: 0,
				description: 'Tax total. Leave 0 to skip.',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'taxTotal', value: '={{ $value || undefined }}' } },
			},
			{
				displayName: 'Team Cost',
				name: 'apptEmployeeCost',
				type: 'number',
				default: 0,
				description: 'What the team is paid for this job (reduces the commission base). Leave 0 to skip.',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'employeeCost', value: '={{ $value || undefined }}' } },
			},
			{
				displayName: 'Company Cost',
				name: 'apptCompanyCost',
				type: 'number',
				default: 0,
				description: 'Parts, materials, subcontractors (reduces the commission base). Leave 0 to skip.',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'companyCost', value: '={{ $value || undefined }}' } },
			},
			{
				displayName: 'Line Items (JSON)',
				name: 'apptLineItemsJson',
				type: 'json',
				default: '[]',
				description: 'Priced work as a JSON array of { name, description, quantity, unitPrice, taxable, taxRate }. When given, subtotal, tax and total are computed from the lines. Leave [] to skip.',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'lineItems', value: '={{ (Array.isArray($value) ? $value : JSON.parse($value || "[]")).length ? (Array.isArray($value) ? $value : JSON.parse($value)) : undefined }}' } },
			},
			{
				displayName: 'Applied Tax ID',
				name: 'apptAppliedTaxId',
				type: 'string',
				default: '',
				description: "A tax id from the assigned company's taxes (Operations -> Taxes). Fills the tax name and rate; taxable lines follow it.",
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'appliedTaxId', value: '={{ $value || undefined }}' } },
			},
			{
				displayName: 'Tax Rate',
				name: 'apptTaxRate',
				type: 'string',
				default: '',
				description: 'A rate without a tax record - percent like 8.25% or a fraction 0-1.',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'taxRate', value: '={{ $value || undefined }}' } },
			},
			{
				displayName: 'Balance Due',
				name: 'apptBalance',
				type: 'number',
				default: 0,
				description: 'What the client still owes. Leave 0 and it follows the total.',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'balance', value: '={{ $value || undefined }}' } },
			},
			{
				displayName: 'Currency',
				name: 'apptCurrency',
				type: 'string',
				default: '',
				description: '3-letter code like USD.',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'currency', value: '={{ $value || undefined }}' } },
			},
			{
				displayName: 'Payment Terms (Days)',
				name: 'apptTerms',
				type: 'number',
				default: 0,
				description: 'Payment terms in days. Leave 0 to skip.',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'terms', value: '={{ $value || undefined }}' } },
			},
			{
				displayName: 'Latitude',
				name: 'apptLatitude',
				type: 'number',
				default: 0,
				description: 'Send with Longitude. Leave 0 to skip.',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'latitude', value: '={{ $value || undefined }}' } },
			},
			{
				displayName: 'Longitude',
				name: 'apptLongitude',
				type: 'number',
				default: 0,
				description: 'Send with Latitude. Leave 0 to skip.',
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'longitude', value: '={{ $value || undefined }}' } },
			},
			{
				displayName: 'Note',
				name: 'apptNote',
				type: 'string',
				default: '',
				description: "Added to the appointment's notes, signed by the API key's owner.",
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'note', value: '={{ $value || undefined }}' } },
			},
			{
				displayName: 'Booked By (Member ID)',
				name: 'apptCreatedById',
				type: 'string',
				default: '',
				description: "The team member who booked the job (GET /v1/team). Defaults to the API key's owner.",
				displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'createdById', value: '={{ $value || undefined }}' } },
			},

			// ---------------- Invoice ----------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['invoice'] } },
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create an invoice',
						routing: {
							request: { method: 'POST', url: '/invoices' },
							output: unwrapData,
						},
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get an invoice',
						routing: {
							request: { method: 'GET', url: '=/invoices/{{$parameter.id}}' },
							output: unwrapData,
						},
					},
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many invoices',
						routing: {
							request: { method: 'GET', url: '/invoices' },
							output: unwrapData,
						},
					},
				],
				default: 'getMany',
			},
			{
				displayName: 'Invoice Name',
				name: 'invoiceName',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['invoice'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'invoiceName' } },
			},
			{
				displayName: 'Client ID',
				name: 'invoiceClientId',
				type: 'string',
				default: '',
				description: 'Optional Genaya client record ID to link the invoice to',
				displayOptions: { show: { resource: ['invoice'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'clientId' } },
			},
			{
				displayName: 'Line Items (JSON)',
				name: 'lineItemsJson',
				type: 'json',
				default:
					'[\n  {\n    "name": "Service",\n    "quantity": 1,\n    "unitPrice": 100,\n    "taxable": false\n  }\n]',
				description:
					'Array of line items ({name, description, quantity, unitPrice, taxable, taxRate}). Totals are computed by Genaya.',
				displayOptions: { show: { resource: ['invoice'], operation: ['create'] } },
				routing: {
					send: {
						type: 'body',
						property: 'lineItems',
						value:
							'={{ typeof $value === "string" ? JSON.parse($value || "[]") : $value }}',
					},
				},
			},
			{
				displayName: 'Notes',
				name: 'invoiceNotes',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				displayOptions: { show: { resource: ['invoice'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'notes' } },
			},

			// ---------------- Task ----------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['task'] } },
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a task',
						routing: {
							request: { method: 'POST', url: '/tasks' },
							output: unwrapData,
						},
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a task',
						routing: {
							request: { method: 'GET', url: '=/tasks/{{$parameter.id}}' },
							output: unwrapData,
						},
					},
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many tasks',
						routing: {
							request: { method: 'GET', url: '/tasks' },
							output: unwrapData,
						},
					},
				],
				default: 'getMany',
			},
			{
				displayName: 'Title',
				name: 'taskTitle',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'title' } },
			},
			{
				displayName: 'Group ID',
				name: 'taskGroupId',
				type: 'string',
				required: true,
				default: '',
				description:
					'The task group to create the task in (list environments and groups with GET /v1/task-environments)',
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'groupId' } },
			},
			{
				displayName: 'Description',
				name: 'taskDescription',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'description' } },
			},
			{
				displayName: 'Due Date',
				name: 'taskDueDate',
				type: 'dateTime',
				default: '',
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'dueDate' } },
			},
			{
				displayName: 'Priority',
				name: 'taskPriority',
				type: 'options',
				options: [
					{ name: 'High', value: 'high' },
					{ name: 'Low', value: 'low' },
					{ name: 'Lowest', value: 'lowest' },
					{ name: 'Normal', value: 'normal' },
					{ name: 'Urgent', value: 'urgent' },
				],
				default: 'normal',
				displayOptions: { show: { resource: ['task'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'priority' } },
			},

			// ---------------- Message ----------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['message'] } },
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get a message',
						routing: {
							request: { method: 'GET', url: '=/messages/{{$parameter.id}}' },
							output: unwrapData,
						},
					},
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many messages',
						routing: {
							request: { method: 'GET', url: '/messages' },
							output: unwrapData,
						},
					},
					{
						name: 'Send',
						value: 'create',
						action: 'Send an SMS message',
						routing: {
							request: { method: 'POST', url: '/messages' },
							output: unwrapData,
						},
					},
				],
				default: 'create',
			},
			{
				displayName: 'To',
				name: 'messageTo',
				type: 'string',
				required: true,
				default: '',
				description: 'Destination phone number in E.164 format, for example +14155550142',
				displayOptions: { show: { resource: ['message'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'to' } },
			},
			{
				displayName: 'Message Body',
				name: 'messageBody',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				displayOptions: { show: { resource: ['message'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'body' } },
			},
			{
				displayName: 'From',
				name: 'messageFrom',
				type: 'string',
				default: '',
				description:
					"One of your Genaya numbers (E.164). Leave empty to let Genaya pick the organization's SMS-capable number.",
				displayOptions: { show: { resource: ['message'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'from' } },
			},

			// Shared fields (kept last so resource-specific fields render first)
			idField,
			limitField,
		],
	};

	methods = {
		loadOptions: {
			async getLeadTables(this: ILoadOptionsFunctions) {
				const response = await genayaApiRequest.call(this, 'GET', '/lead-tables', undefined, {
					limit: 100,
				});
				const tables = Array.isArray(response.data) ? response.data : [];
				return tables.map((t: { id: string; name?: string }) => ({
					name: t.name || t.id,
					value: t.id,
				}));
			},
		},
	};
}
