import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionType, NodeConnectionTypes } from 'n8n-workflow';

import { genayaApiRequest } from '../Genaya/GenericFunctions';

// Instant trigger backed by Genaya outbound webhooks:
//   activate   -> POST /v1/webhook-endpoints { url, events, description: "n8n" }
//   deactivate -> DELETE /v1/webhook-endpoints/:id
// Deliveries are the event envelope { id, object: "event", type, created,
// organization_id, data: { object } }; the emitted item is data.object merged
// with { event_id, event_type } (the same shape the Genaya Zapier app emits).

export class GenayaTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Genaya Trigger',
		name: 'genayaTrigger',
		icon: 'file:genaya.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when a Genaya event happens',
		defaults: { name: 'Genaya Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'genayaApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [],
				description: 'The Genaya events that start this workflow',
				options: [
					{ name: 'Appointment Created', value: 'appointment.created' },
					{ name: 'Appointment Deleted', value: 'appointment.deleted' },
					{ name: 'Appointment Status Changed', value: 'appointment.status_changed' },
					{ name: 'Appointment Updated', value: 'appointment.updated' },
					{ name: 'Call Completed', value: 'call.completed' },
					{ name: 'Call Missed', value: 'call.missed' },
					{ name: 'Client Created', value: 'client.created' },
					{ name: 'Estimate Created', value: 'estimate.created' },
					{ name: 'Estimate Sent', value: 'estimate.sent' },
					{ name: 'Estimate Status Changed', value: 'estimate.status_changed' },
					{ name: 'Form Submitted', value: 'form.submitted' },
					{ name: 'Invoice Created', value: 'invoice.created' },
					{ name: 'Invoice Paid', value: 'invoice.paid' },
					{ name: 'Invoice Sent', value: 'invoice.sent' },
					{ name: 'Lead Created', value: 'lead.created' },
					{ name: 'Payment Received', value: 'payment.received' },
					{ name: 'Review Received', value: 'review.received' },
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (!webhookData.webhookId) return false;
				try {
					await genayaApiRequest.call(
						this,
						'GET',
						`/webhook-endpoints/${webhookData.webhookId}`,
					);
					return true;
				} catch (error) {
					delete webhookData.webhookId;
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events') as string[];
				const response = await genayaApiRequest.call(this, 'POST', '/webhook-endpoints', {
					url: webhookUrl,
					events,
					description: 'n8n',
				});
				const endpoint = (response.data as IDataObject) || {};
				if (!endpoint.id) return false;
				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId = endpoint.id;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId) {
					try {
						await genayaApiRequest.call(
							this,
							'DELETE',
							`/webhook-endpoints/${webhookData.webhookId}`,
						);
					} catch (error) {
						return false;
					}
					delete webhookData.webhookId;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		const data = (body.data as IDataObject) || {};
		const object = (data.object as IDataObject) || {};
		return {
			workflowData: [
				this.helpers.returnJsonArray([
					{
						...object,
						event_id: (body.id as string) || null,
						event_type: (body.type as string) || null,
					},
				]),
			],
		};
	}
}
