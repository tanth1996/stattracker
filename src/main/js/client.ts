'use strict';

import rest from 'rest';
import defaultRequest from 'rest/interceptor/defaultRequest';
import mime from 'rest/interceptor/mime';
import uriTemplateInterceptor from './api/uriTemplateInterceptor';
import errorCode from 'rest/interceptor/errorCode';
import baseRegistry from 'rest/mime/registry';

const registry = baseRegistry;

registry.register('text/uri-list', {
	read: function(str /*, opts */) {
		return str.split('\n');
	},
	write: function(obj /*, opts */) {
		// If this is an Array, extract the self URI and then join using a newline
		if (obj instanceof Array) {
			return obj.map(resource => resource._links.self.href).join('\n');
		} else { // otherwise, just return the self URI
			return obj._links.self.href;
		}
	}
});
registry.register('application/hal+json', require('rest/mime/type/application/hal'));

export = rest
		.wrap(mime, { registry: registry })
		.wrap(uriTemplateInterceptor)
		.wrap(errorCode)
		.wrap(defaultRequest, { headers: { 'Accept': 'application/hal+json' }});