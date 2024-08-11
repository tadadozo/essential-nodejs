import { HttpClient } from "../../../libs/web/HttpClient.js";

/**
 * a more generic query oriented approach
 * based on //https://api.ardaudiothek.de/graphiql
 */
export const ArdAudiothekQueryClient = class ArdAudiothekQueryClient {
    /**
     * Creates a new instance
     */
    constructor() {
    }

    /**
     * Initializes the client with the optional root url
     * @param {string=} url - optional root url of the audiothek, the default is https://api.ardaudiothek.de/graphql
     */
    async initAsync(url) {
        if (!url) {
            url = "https://api.ardaudiothek.de/graphql";
        }
        this.client = await HttpClient.create(url);
    }

    async retrieveOrganizationsAsync() {
        let response = await this.postQueryStringAsync(
            `
{
  query:organizations{
     nodes{
      name coreId title
    }
  }
}
`);
        return response.data.query.nodes;
    }

    async retrieveOrganizationsByNameAsync(name) {
        let response = await this.postQueryStringAsync(
            `
        {
          query:organizations(filter:{name:{equalTo:"${name}"}}){
             nodes{
              name coreId title
            }
          }
        }
        `);
        return response.data.query.nodes;
    }

    async retrievePublicationServicesByOrganizationNameAsync(name) {
        let response = await this.postQueryStringAsync(
            `
        {
          query:publicationServices(filter:{organizationName:{equalTo:"${name}"}}){
             nodes{
               organizationName title coreId homepageUrl nodeId
            }
          }
        }
        `);
        return response.data.query.nodes;
    }

    async retrievePublicationServicesByServiceNameAsync(organizationName, serviceName) {
        let response = await this.postQueryStringAsync(
            `
        {
          query:publicationServices(filter:{organizationName:{equalTo:"${organizationName}"} title:{equalTo:"${serviceName}"}}){
             nodes{
               organizationName title coreId homepageUrl nodeId
            }
          }
        }
        `);
        return response.data.query.nodes;
    }

    async retrieveProgramSetsByPublicationServiceCoreIdAsync(coreId) {
        let response = await this.postQueryStringAsync(
            `
{
  query:publicationService(id:"${coreId}"){
     programSets(orderBy:TITLE_ASC){
      nodes{
        coreId title feedUrl feedUrl2 numberOfElements
      }
    }
  }
}
        `);
        return response.data.query.programSets.nodes;
    }


    buildQueryBody(operationName, query, variables) {
        return {
            operationName: operationName,
            query: `${query}`,
            variables: variables
        };
    }

    async retrieveAsync(query, modifyHeader) {
        return (await this.client.get(query.trim(), modifyHeader));
    }

    async postAsync(query, body, modifyHeader) {
        return (await this.client.postjson(query.trim(), body, modifyHeader));
    }

    async postQueryStringAsync(body, modifyHeader) {
        return await this.postAsync("", this.buildQueryBody(null, body, null));
    }
};

