* Why not just redirect users through /visitormatch on every request?
** These redirects are typically not cacheable; they will require a network request every time
** There is no API available to separate user id from ext data
* Why not just use JSONp and cache respones
** JSONP responses *can* be cached and they *can* be generated via a client-side document, but generating them 'client side' for the purposes of visitor matching is not feasible since the JSONP code executes outside of the domain owned by a DSP
** JSONP gives DSPs access directly to the publisher doc and thus publisher / ad-server cookies (haram)
* Why not use window.postMessage
** It's not quite supported across all browsers