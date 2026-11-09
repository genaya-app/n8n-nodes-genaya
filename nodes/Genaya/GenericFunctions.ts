import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

const BASE_URL = 'https://api.genaya.com/v1';

// Authenticated request against the Genaya public API. Used by the trigger
// node's webhook lifecycle and by loadOptions dropdowns; the main Genaya node
// is declarative and routes its own requests.
export async function genayaApiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${BASE_URL}${endpoint}`,
		json: true,
	};
	if (body && Object.keys(body).length) options.body = body;
	if (qs && Object.keys(qs).length) options.qs = qs;
	return (await this.helpers.httpRequestWithAuthentication.call(
		this,
		'genayaApi',
		options,
	)) as IDataObject;
}
