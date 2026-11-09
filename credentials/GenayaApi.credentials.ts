import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GenayaApi implements ICredentialType {
	name = 'genayaApi';

	displayName = 'Genaya API';

	documentationUrl = 'https://developer.genaya.com';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Your Genaya API key (starts with gny_live_). Create one in the Genaya app under Settings > Developer > API Keys. Requires the Individual plan or above (a live key - trial test keys cannot write).',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.genaya.com/v1',
			url: '/ping',
		},
	};
}
