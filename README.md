# Identity Credential Decoder Specification

## Purpose
App developers can paste generic Identity tokens with limited understanding of their purpose, use, or contents, and receive feedback.
Data entered into the system should be stored in the developer’s local system to provide some memory and persistence for convenience purposes.
The system should support decoding of JWT and JWE tokens. Recursive decoding techniques designed to pull data regardless of the form of the token should be used.  For example, if the user enters a partial token, perhaps just the heading, that should still be decoded, identified if possible, and the associated information displayed.

## Architectural Description
### Phase 1
The system is comprised of a Node.js webscript and associated image and data files with write permissions to a storage subfolder. The script is run on a publicly accessible machine so that the IP address can be linked to a common web url.
The html-based UX uses the w3.css framework.
The interface allows entry of a payload in a way that facilitates thinking of payloads as a list.
Payloads entered into the list are maintained on the users local storage.
Decryption keys entered are maintained on the users local storage.
Decoding of the token pieces are done in the client web browser wherever possible.
### Phase 2
Users can authenticate using a Microsoft account.  The system will contact KeyVault to retrieve decryption keys based on the logged in user.  These decryption keys will then be automatically available for the user to select.
### Extra:
When logged in, users can push stored local data to the server.  
Users are very prominently notified that all stored data is kept on their local machine.
Token expiration timer
Token generation from Private Key
Adding of .cer/pfx files
Support for PFT
CBOR, concise binary object representation for JWTs, easy to get standard library and parse
