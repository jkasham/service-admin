import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import authVariables from './auth/auth-variables';
import OAuthClient from './auth/OAuthClient';
import { runInNewContext } from 'vm';



const app = express();
app.use(bodyParser.json());

//static files
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, '/webapp')));



let oauthClient = null;
let isAuthenticated = false;


const qb_base_uri = 'sandbox-quickbooks.api.intuit.com';
const qb_customerId = '4620816365043830330';
const qb_minorVersion = '47';



app.get('/auth/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/auth-login-assets/login.html'))
})

app.post('/auth/login', (req, res) => {
    console.log("login")
    res.send('');
})

app.get('/auth/intuit/login', (req, res) => {

    oauthClient = new OAuthClient({
        clientId: authVariables.clientId,
        clientSecret: authVariables.clientSecret,
        environment: authVariables.environment,
        redirectUri: authVariables.callbackUrl
    });

    const authUri = oauthClient.authorizeUri({scope:[OAuthClient.scopes.Accounting],state:'intuit-test'});
    
    res.redirect(authUri);
})

app.get('/auth/callback', (req, res) => {
 
    var parseRedirect = req.url;
 
    // Exchange the auth code retrieved from the **req.url** on the redirectUri
    oauthClient.createToken(parseRedirect)
    .then(function(authResponse) {

        console.log('The Token is  '+ JSON.stringify(authResponse.getJson()));
        
        isAuthenticated = true;
        res.redirect(path.join('/home'));
    })
    .catch(function(e) {
        console.error("The error message is :"+e.originalMessage);
    });

    //res.redirect('/');
    
})

/*
app.get('*', (req, res) => {
    if(!isLoggedIn) {
        res.redirect(path.join('/auth/login'));
    }
})
*/



app.get('/auth/logout', (req, res) => {
    

    const authUri = oauthClient.authorizeUri({scope:[OAuthClient.scopes.OpenId,OAuthClient.scopes.Email],state:'intuit-test'});
    
    oauthClient.revoke()
    .then(function(authResponse) {
        console.log('Tokens revoked : ' + JSON.stringify(authResponse.json()));
    })
    .catch(function(e) {
        console.error("The error message is :"+e.originalMessage);
        console.error(e.intuit_tid);
    });

    console.log('LOGOUT:');
    isAuthenticated = false;
    res.redirect(path.join('/auth/login'));

})


/* 
***********************************************************************************************************************
***********************************************************************************************************************
TEMP ENDPOINTS
*/ 
app.get('/api/customers', (req, res) => {
    const body = `Select * from Customer startposition 1 maxresults 5`;

    if (oauthClient.isAccessTokenValid()) {
        oauthClient.makeApiCall({
            url: `https://${qb_base_uri}/v3/company/${qb_customerId}/query?query=select * from Customer&minorversion=${qb_minorVersion}`
        }).then(function (response) {
            res.status(200).send(response.body);
        }).catch(function (e) {
            console.log('The error is ' + JSON.stringify(e));
        });
    }

    //res.status(200).send(`{"QueryResponse":{"Customer":[{"Taxable":true,"BillAddr":{"Id":"2","Line1":"4581 Finch St.","City":"Bayshore","CountrySubDivisionCode":"CA","PostalCode":"94326","Lat":"INVALID","Long":"INVALID"},"ShipAddr":{"Id":"2","Line1":"4581 Finch St.","City":"Bayshore","CountrySubDivisionCode":"CA","PostalCode":"94326","Lat":"INVALID","Long":"INVALID"},"Job":false,"BillWithParent":false,"Balance":239.00,"BalanceWithJobs":239.00,"CurrencyRef":{"value":"USD","name":"United States Dollar"},"PreferredDeliveryMethod":"Print","IsProject":false,"ClientEntityId":"0","domain":"QBO","sparse":false,"Id":"1","SyncToken":"0","MetaData":{"CreateTime":"2020-03-01T16:48:43-08:00","LastUpdatedTime":"2020-03-08T13:39:32-07:00"},"GivenName":"Amy","FamilyName":"Lauterbach","FullyQualifiedName":"Amy's Bird Sanctuary","CompanyName":"Amy's Bird Sanctuary","DisplayName":"Amy's Bird Sanctuary","PrintOnCheckName":"Amy's Bird Sanctuary","Active":true,"PrimaryPhone":{"FreeFormNumber":"(650) 555-3311"},"PrimaryEmailAddr":{"Address":"Birds@Intuit.com"}},{"Taxable":false,"BillAddr":{"Id":"3","Line1":"12 Ocean Dr.","City":"Half Moon Bay","CountrySubDivisionCode":"CA","PostalCode":"94213","Lat":"37.4307072","Long":"-122.4295234"},"Job":false,"BillWithParent":false,"Balance":85.00,"BalanceWithJobs":85.00,"CurrencyRef":{"value":"USD","name":"United States Dollar"},"PreferredDeliveryMethod":"Print","IsProject":false,"ClientEntityId":"0","domain":"QBO","sparse":false,"Id":"2","SyncToken":"0","MetaData":{"CreateTime":"2020-03-01T16:49:28-08:00","LastUpdatedTime":"2020-03-08T12:56:01-07:00"},"GivenName":"Bill","FamilyName":"Lucchini","FullyQualifiedName":"Bill's Windsurf Shop","CompanyName":"Bill's Windsurf Shop","DisplayName":"Bill's Windsurf Shop","PrintOnCheckName":"Bill's Windsurf Shop","Active":true,"PrimaryPhone":{"FreeFormNumber":"(415) 444-6538"},"PrimaryEmailAddr":{"Address":"Surf@Intuit.com"}},{"Taxable":false,"BillAddr":{"Id":"4","Line1":"65 Ocean Dr.","City":"Half Moon Bay","CountrySubDivisionCode":"CA","PostalCode":"94213","Lat":"37.4300318","Long":"-122.4336537"},"Job":false,"BillWithParent":false,"Balance":0,"BalanceWithJobs":0,"CurrencyRef":{"value":"USD","name":"United States Dollar"},"PreferredDeliveryMethod":"Print","IsProject":false,"ClientEntityId":"0","domain":"QBO","sparse":false,"Id":"3","SyncToken":"0","MetaData":{"CreateTime":"2020-03-01T16:51:22-08:00","LastUpdatedTime":"2020-03-09T12:59:21-07:00"},"GivenName":"Grace","FamilyName":"Pariente","FullyQualifiedName":"Cool Cars","CompanyName":"Cool Cars","DisplayName":"Cool Cars","PrintOnCheckName":"Cool Cars","Active":true,"PrimaryPhone":{"FreeFormNumber":"(415) 555-9933"},"PrimaryEmailAddr":{"Address":"Cool_Cars@intuit.com"}},{"Taxable":false,"BillAddr":{"Id":"5","Line1":"321 Channing","City":"Palo Alto","CountrySubDivisionCode":"CA","PostalCode":"94303","Lat":"37.443231","Long":"-122.1561846"},"Job":false,"BillWithParent":false,"Balance":0,"BalanceWithJobs":0,"CurrencyRef":{"value":"USD","name":"United States Dollar"},"PreferredDeliveryMethod":"Print","IsProject":false,"ClientEntityId":"0","domain":"QBO","sparse":false,"Id":"4","SyncToken":"0","MetaData":{"CreateTime":"2020-03-01T16:52:08-08:00","LastUpdatedTime":"2020-03-01T16:52:08-08:00"},"GivenName":"Diego","FamilyName":"Rodriguez","FullyQualifiedName":"Diego Rodriguez","DisplayName":"Diego Rodriguez","PrintOnCheckName":"Diego Rodriguez","Active":true,"PrimaryPhone":{"FreeFormNumber":"(650) 555-4477"},"PrimaryEmailAddr":{"Address":"Diego@Rodriguez.com"}},{"Taxable":true,"BillAddr":{"Id":"6","Line1":"25 Court St.","City":"Tucson","CountrySubDivisionCode":"AZ","PostalCode":"85719","Lat":"32.2841116","Long":"-110.9744298"},"ShipAddr":{"Id":"6","Line1":"25 Court St.","City":"Tucson","CountrySubDivisionCode":"AZ","PostalCode":"85719","Lat":"32.2841116","Long":"-110.9744298"},"Job":false,"BillWithParent":false,"Balance":0,"BalanceWithJobs":0,"CurrencyRef":{"value":"USD","name":"United States Dollar"},"PreferredDeliveryMethod":"Print","IsProject":false,"ClientEntityId":"0","domain":"QBO","sparse":false,"Id":"5","SyncToken":"1","MetaData":{"CreateTime":"2020-03-01T16:54:59-08:00","LastUpdatedTime":"2020-03-08T13:28:29-07:00"},"GivenName":"Peter","FamilyName":"Dukes","FullyQualifiedName":"Dukes Basketball Camp","CompanyName":"Dukes Basketball Camp","DisplayName":"Dukes Basketball Camp","PrintOnCheckName":"Dukes Basketball Camp","Active":true,"PrimaryPhone":{"FreeFormNumber":"(520) 420-5638"},"PrimaryEmailAddr":{"Address":"Dukes_bball@intuit.com"}}],"startPosition":1,"maxResults":5},"time":"2020-04-22T13:41:14.023-07:00"}`);
})
app.post('/api/customers', (req, res) => {
    res.status(200).send(`{"QueryResponse":{"Customer":[{"Taxable":true,"BillAddr":{"Id":"2","Line1":"4581 Finch St.","City":"Bayshore","CountrySubDivisionCode":"CA","PostalCode":"94326","Lat":"INVALID","Long":"INVALID"},"ShipAddr":{"Id":"2","Line1":"4581 Finch St.","City":"Bayshore","CountrySubDivisionCode":"CA","PostalCode":"94326","Lat":"INVALID","Long":"INVALID"},"Job":false,"BillWithParent":false,"Balance":239.00,"BalanceWithJobs":239.00,"CurrencyRef":{"value":"USD","name":"United States Dollar"},"PreferredDeliveryMethod":"Print","IsProject":false,"ClientEntityId":"0","domain":"QBO","sparse":false,"Id":"1","SyncToken":"0","MetaData":{"CreateTime":"2020-03-01T16:48:43-08:00","LastUpdatedTime":"2020-03-08T13:39:32-07:00"},"GivenName":"Amy","FamilyName":"Lauterbach","FullyQualifiedName":"Amy's Bird Sanctuary","CompanyName":"Amy's Bird Sanctuary","DisplayName":"Amy's Bird Sanctuary","PrintOnCheckName":"Amy's Bird Sanctuary","Active":true,"PrimaryPhone":{"FreeFormNumber":"(650) 555-3311"},"PrimaryEmailAddr":{"Address":"Birds@Intuit.com"}},{"Taxable":false,"BillAddr":{"Id":"3","Line1":"12 Ocean Dr.","City":"Half Moon Bay","CountrySubDivisionCode":"CA","PostalCode":"94213","Lat":"37.4307072","Long":"-122.4295234"},"Job":false,"BillWithParent":false,"Balance":85.00,"BalanceWithJobs":85.00,"CurrencyRef":{"value":"USD","name":"United States Dollar"},"PreferredDeliveryMethod":"Print","IsProject":false,"ClientEntityId":"0","domain":"QBO","sparse":false,"Id":"2","SyncToken":"0","MetaData":{"CreateTime":"2020-03-01T16:49:28-08:00","LastUpdatedTime":"2020-03-08T12:56:01-07:00"},"GivenName":"Bill","FamilyName":"Lucchini","FullyQualifiedName":"Bill's Windsurf Shop","CompanyName":"Bill's Windsurf Shop","DisplayName":"Bill's Windsurf Shop","PrintOnCheckName":"Bill's Windsurf Shop","Active":true,"PrimaryPhone":{"FreeFormNumber":"(415) 444-6538"},"PrimaryEmailAddr":{"Address":"Surf@Intuit.com"}},{"Taxable":false,"BillAddr":{"Id":"4","Line1":"65 Ocean Dr.","City":"Half Moon Bay","CountrySubDivisionCode":"CA","PostalCode":"94213","Lat":"37.4300318","Long":"-122.4336537"},"Job":false,"BillWithParent":false,"Balance":0,"BalanceWithJobs":0,"CurrencyRef":{"value":"USD","name":"United States Dollar"},"PreferredDeliveryMethod":"Print","IsProject":false,"ClientEntityId":"0","domain":"QBO","sparse":false,"Id":"3","SyncToken":"0","MetaData":{"CreateTime":"2020-03-01T16:51:22-08:00","LastUpdatedTime":"2020-03-09T12:59:21-07:00"},"GivenName":"Grace","FamilyName":"Pariente","FullyQualifiedName":"Cool Cars","CompanyName":"Cool Cars","DisplayName":"Cool Cars","PrintOnCheckName":"Cool Cars","Active":true,"PrimaryPhone":{"FreeFormNumber":"(415) 555-9933"},"PrimaryEmailAddr":{"Address":"Cool_Cars@intuit.com"}},{"Taxable":false,"BillAddr":{"Id":"5","Line1":"321 Channing","City":"Palo Alto","CountrySubDivisionCode":"CA","PostalCode":"94303","Lat":"37.443231","Long":"-122.1561846"},"Job":false,"BillWithParent":false,"Balance":0,"BalanceWithJobs":0,"CurrencyRef":{"value":"USD","name":"United States Dollar"},"PreferredDeliveryMethod":"Print","IsProject":false,"ClientEntityId":"0","domain":"QBO","sparse":false,"Id":"4","SyncToken":"0","MetaData":{"CreateTime":"2020-03-01T16:52:08-08:00","LastUpdatedTime":"2020-03-01T16:52:08-08:00"},"GivenName":"Diego","FamilyName":"Rodriguez","FullyQualifiedName":"Diego Rodriguez","DisplayName":"Diego Rodriguez","PrintOnCheckName":"Diego Rodriguez","Active":true,"PrimaryPhone":{"FreeFormNumber":"(650) 555-4477"},"PrimaryEmailAddr":{"Address":"Diego@Rodriguez.com"}},{"Taxable":true,"BillAddr":{"Id":"6","Line1":"25 Court St.","City":"Tucson","CountrySubDivisionCode":"AZ","PostalCode":"85719","Lat":"32.2841116","Long":"-110.9744298"},"ShipAddr":{"Id":"6","Line1":"25 Court St.","City":"Tucson","CountrySubDivisionCode":"AZ","PostalCode":"85719","Lat":"32.2841116","Long":"-110.9744298"},"Job":false,"BillWithParent":false,"Balance":0,"BalanceWithJobs":0,"CurrencyRef":{"value":"USD","name":"United States Dollar"},"PreferredDeliveryMethod":"Print","IsProject":false,"ClientEntityId":"0","domain":"QBO","sparse":false,"Id":"5","SyncToken":"1","MetaData":{"CreateTime":"2020-03-01T16:54:59-08:00","LastUpdatedTime":"2020-03-08T13:28:29-07:00"},"GivenName":"Peter","FamilyName":"Dukes","FullyQualifiedName":"Dukes Basketball Camp","CompanyName":"Dukes Basketball Camp","DisplayName":"Dukes Basketball Camp","PrintOnCheckName":"Dukes Basketball Camp","Active":true,"PrimaryPhone":{"FreeFormNumber":"(520) 420-5638"},"PrimaryEmailAddr":{"Address":"Dukes_bball@intuit.com"}}],"startPosition":1,"maxResults":5},"time":"2020-04-22T13:41:14.023-07:00"}`);
})

app.get('/api/customer/:id', (req, res) => {
    
    const custRef = req.params.id;

    if (oauthClient.isAccessTokenValid()) {
        oauthClient.makeApiCall({
            url: `https://${qb_base_uri}/v3/company/${qb_customerId}/customer/${custRef}?minorversion=${qb_minorVersion}`
        }).then(function (response) {
            res.status(200).send(response.body);
        }).catch(function (e) {
            console.log('The error is ' + JSON.stringify(e));
        });
    }

    //res.status(200).send(`{"Customer":{"Taxable":false,"BillAddr":{"Id":"4","Line1":"65 Ocean Dr.","City":"Half Moon Bay","CountrySubDivisionCode":"CA","PostalCode":"94213","Lat":"37.4300318","Long":"-122.4336537"},"Job":false,"BillWithParent":false,"Balance":0,"BalanceWithJobs":0,"CurrencyRef":{"value":"USD","name":"United States Dollar"},"PreferredDeliveryMethod":"Print","IsProject":false,"domain":"QBO","sparse":false,"Id":"3","SyncToken":"0","MetaData":{"CreateTime":"2020-03-01T16:51:22-08:00","LastUpdatedTime":"2020-04-07T04:28:37-07:00"},"GivenName":"Grace","FamilyName":"Pariente","FullyQualifiedName":"Cool Cars","CompanyName":"Cool Cars","DisplayName":"Cool Cars","PrintOnCheckName":"Cool Cars","Active":true,"PrimaryPhone":{"FreeFormNumber":"(415) 555-9933"},"PrimaryEmailAddr":{"Address":"Cool_Cars@intuit.com"}},"time":"2020-05-16T14:14:54.732-07:00"}`);


})

app.get('/api/customer/:id/invoice/list', (req, res) => {

    const custRef = req.params.id;

    if (oauthClient.isAccessTokenValid()) {
        oauthClient.makeApiCall({
            url: `https://${qb_base_uri}/v3/company/${qb_customerId}/query?query=select * from invoice where CustomerRef='${custRef}'&minorversion=${qb_minorVersion}`
        }).then(function (response) {
            res.status(200).send(response.body);
        }).catch(function (e) {
            console.log('The error is ' + JSON.stringify(e));
        });
    }


    //res.status(200).send(`{"QueryResponse":{"Invoice":[{"AllowIPNPayment":false,"AllowOnlinePayment":false,"AllowOnlineCreditCardPayment":false,"AllowOnlineACHPayment":false,"domain":"QBO","sparse":false,"Id":"67","SyncToken":"2","MetaData":{"CreateTime":"2020-03-08T12:40:06-07:00","LastUpdatedTime":"2020-03-08T13:39:32-07:00"},"CustomField":[{"DefinitionId":"1","Name":"Crew #","Type":"StringType"}],"DocNumber":"1021","TxnDate":"2020-02-16","CurrencyRef":{"value":"USD","name":"United States Dollar"},"LinkedTxn":[{"TxnId":"101","TxnType":"Payment"}],"Line":[{"Id":"1","LineNum":1,"Description":"2 cubic ft. bag","Amount":150.00,"DetailType":"SalesItemLineDetail","SalesItemLineDetail":{"ItemRef":{"value":"15","name":"Soil"},"UnitPrice":10,"Qty":15,"ItemAccountRef":{"value":"49","name":"Landscaping Services:Job Materials:Plants and Soil"},"TaxCodeRef":{"value":"TAX"}}},{"Id":"2","LineNum":2,"Description":"Rock Fountain","Amount":275.00,"DetailType":"SalesItemLineDetail","SalesItemLineDetail":{"ItemRef":{"value":"5","name":"Rock Fountain"},"UnitPrice":275,"Qty":1,"ItemAccountRef":{"value":"48","name":"Landscaping Services:Job Materials:Fountains and Garden Lighting"},"TaxCodeRef":{"value":"TAX"}}},{"Amount":425.00,"DetailType":"SubTotalLineDetail","SubTotalLineDetail":{}}],"TxnTaxDetail":{"TxnTaxCodeRef":{"value":"2"},"TotalTax":34.00,"TaxLine":[{"Amount":34.00,"DetailType":"TaxLineDetail","TaxLineDetail":{"TaxRateRef":{"value":"3"},"PercentBased":true,"TaxPercent":8,"NetAmountTaxable":425.00}}]},"CustomerRef":{"value":"1","name":"Amy's Bird Sanctuary"},"CustomerMemo":{"value":"Thank you for your business and have a great day!"},"BillAddr":{"Id":"74","Line1":"Amy Lauterbach","Line2":"Amy's Bird Sanctuary","Line3":"4581 Finch St.","Line4":"Bayshore, CA  94326","Lat":"INVALID","Long":"INVALID"},"ShipAddr":{"Id":"2","Line1":"4581 Finch St.","City":"Bayshore","CountrySubDivisionCode":"CA","PostalCode":"94326","Lat":"INVALID","Long":"INVALID"},"FreeFormAddress":true,"SalesTermRef":{"value":"3"},"DueDate":"2020-03-17","TotalAmt":459.00,"ApplyTaxAfterDiscount":false,"PrintStatus":"NotSet","EmailStatus":"NotSet","BillEmail":{"Address":"Birds@Intuit.com"},"Balance":239.00},{"AllowIPNPayment":false,"AllowOnlinePayment":false,"AllowOnlineCreditCardPayment":false,"AllowOnlineACHPayment":false,"domain":"QBO","sparse":false,"Id":"9","SyncToken":"3","MetaData":{"CreateTime":"2020-03-06T14:49:30-08:00","LastUpdatedTime":"2020-03-08T13:25:20-07:00"},"CustomField":[{"DefinitionId":"1","Name":"Crew #","Type":"StringType"}],"DocNumber":"1001","TxnDate":"2020-03-06","CurrencyRef":{"value":"USD","name":"United States Dollar"},"PrivateNote":"Front yard, hedges, and sidewalks","LinkedTxn":[{"TxnId":"31","TxnType":"Payment"}],"Line":[{"Id":"1","LineNum":1,"Description":"Weekly Gardening Service","Amount":100.00,"DetailType":"SalesItemLineDetail","SalesItemLineDetail":{"ItemRef":{"value":"6","name":"Gardening"},"UnitPrice":25,"Qty":4,"ItemAccountRef":{"value":"45","name":"Landscaping Services"},"TaxCodeRef":{"value":"TAX"}}},{"Amount":100.00,"DetailType":"SubTotalLineDetail","SubTotalLineDetail":{}}],"TxnTaxDetail":{"TxnTaxCodeRef":{"value":"2"},"TotalTax":8.00,"TaxLine":[{"Amount":8.00,"DetailType":"TaxLineDetail","TaxLineDetail":{"TaxRateRef":{"value":"3"},"PercentBased":true,"TaxPercent":8,"NetAmountTaxable":100.00}}]},"CustomerRef":{"value":"1","name":"Amy's Bird Sanctuary"},"CustomerMemo":{"value":"Thank you for your business and have a great day!"},"BillAddr":{"Id":"47","Line1":"Amy Lauterbach","Line2":"Amy's Bird Sanctuary","Line3":"4581 Finch St.","Line4":"Bayshore, CA  94326","Lat":"INVALID","Long":"INVALID"},"ShipAddr":{"Id":"2","Line1":"4581 Finch St.","City":"Bayshore","CountrySubDivisionCode":"CA","PostalCode":"94326","Lat":"INVALID","Long":"INVALID"},"FreeFormAddress":true,"SalesTermRef":{"value":"3"},"DueDate":"2020-04-05","TotalAmt":108.00,"ApplyTaxAfterDiscount":false,"PrintStatus":"NotSet","EmailStatus":"NotSet","BillEmail":{"Address":"Birds@Intuit.com"},"Balance":0},{"AllowIPNPayment":false,"AllowOnlinePayment":false,"AllowOnlineCreditCardPayment":false,"AllowOnlineACHPayment":false,"domain":"QBO","sparse":false,"Id":"71","SyncToken":"2","MetaData":{"CreateTime":"2020-03-08T12:49:30-07:00","LastUpdatedTime":"2020-03-08T12:51:28-07:00"},"CustomField":[{"DefinitionId":"1","Name":"Crew #","Type":"StringType","StringValue":"102"}],"DocNumber":"1025","TxnDate":"2020-01-21","CurrencyRef":{"value":"USD","name":"United States Dollar"},"LinkedTxn":[{"TxnId":"74","TxnType":"Payment"},{"TxnId":"72","TxnType":"Payment"}],"Line":[{"Id":"1","LineNum":1,"Description":"Weekly Gardening Service","Amount":120.00,"DetailType":"SalesItemLineDetail","SalesItemLineDetail":{"ItemRef":{"value":"6","name":"Gardening"},"UnitPrice":30,"Qty":4,"ItemAccountRef":{"value":"45","name":"Landscaping Services"},"TaxCodeRef":{"value":"NON"}}},{"Id":"2","LineNum":2,"Description":"Pest Control Services","Amount":35.00,"DetailType":"SalesItemLineDetail","SalesItemLineDetail":{"ItemRef":{"value":"10","name":"Pest Control"},"UnitPrice":35,"Qty":1,"ItemAccountRef":{"value":"54","name":"Pest Control Services"},"TaxCodeRef":{"value":"NON"}}},{"Id":"3","LineNum":3,"Description":"Maintenance & Repair","Amount":50.00,"DetailType":"SalesItemLineDetail","SalesItemLineDetail":{"ItemRef":{"value":"9","name":"Maintenance & Repair"},"UnitPrice":50,"Qty":1,"ItemAccountRef":{"value":"53","name":"Landscaping Services:Labor:Maintenance and Repair"},"TaxCodeRef":{"value":"NON"}}},{"Amount":205.00,"DetailType":"SubTotalLineDetail","SubTotalLineDetail":{}}],"TxnTaxDetail":{"TotalTax":0},"CustomerRef":{"value":"1","name":"Amy's Bird Sanctuary"},"CustomerMemo":{"value":"Thank you for your business and have a great day!"},"BillAddr":{"Id":"78","Line1":"Amy Lauterbach","Line2":"Amy's Bird Sanctuary","Line3":"4581 Finch St.","Line4":"Bayshore, CA  94326","Lat":"INVALID","Long":"INVALID"},"ShipAddr":{"Id":"2","Line1":"4581 Finch St.","City":"Bayshore","CountrySubDivisionCode":"CA","PostalCode":"94326","Lat":"INVALID","Long":"INVALID"},"FreeFormAddress":true,"SalesTermRef":{"value":"3"},"DueDate":"2020-02-20","TotalAmt":205.00,"ApplyTaxAfterDiscount":false,"PrintStatus":"NeedToPrint","EmailStatus":"NotSet","BillEmail":{"Address":"Birds@Intuit.com"},"Balance":0}],"startPosition":1,"maxResults":3,"totalCount":3},"time":"2020-05-23T11:57:29.819-07:00"}`);
})

app.get('/api/customer/:id/income', (req, res) => {

    //https://{{baseurl}}/v3/company/{{companyid}}/reports/CustomerIncome?minorversion={{minorversion}}&customer=3&date_macro=This Fiscal Year

    const custRef = req.params.id;

    if (oauthClient.isAccessTokenValid()) {
        oauthClient.makeApiCall({
            url: `https://${qb_base_uri}/v3/company/${qb_customerId}/reports/CustomerIncome?customer=${custRef}&date_macro=This Fiscal Year&minorversion=${qb_minorVersion}`
        }).then(function (response) {
            res.status(200).send(response.body);
        }).catch(function (e) {
            console.log('The error is ' + JSON.stringify(e));
        });
    }
    
    
    
    //res.status(200).send(`{"Header":{"Time":"2020-05-26T13:00:52-07:00","ReportName":"CustomerIncome","DateMacro":"this calendar year","ReportBasis":"Accrual","StartPeriod":"2020-01-01","EndPeriod":"2020-12-31","Currency":"USD","Customer":"3","Option":[{"Name":"NoReportData","Value":"false"}]},"Columns":{"Column":[{"ColTitle":"","ColType":"Customer"},{"ColTitle":"Income","ColType":"Money"},{"ColTitle":"Expenses","ColType":"Money"},{"ColTitle":"Net Income","ColType":"Money"}]},"Rows":{"Row":[{"ColData":[{"value":"Cool Cars","id":"3"},{"value":"2194.00"},{"value":""},{"value":"2194.00"}]},{"Summary":{"ColData":[{"value":"TOTAL"},{"value":"2194.00"},{"value":"0.00"},{"value":"2194.00"}]},"type":"Section","group":"GrandTotal"}]}}`);
})
/* 
TEMP ENDPOINTS
***********************************************************************************************************************
***********************************************************************************************************************
*/ 




//All uncaught traffic from server request goto client
app.get('*', (req, res) => {

    console.log("*************");
    if(!isAuthenticated) {
        res.redirect(path.join('/auth/login'));
    }
    else {
        res.sendFile(path.join(__dirname, '/webapp/index.html'));
    }
})

app.listen(8000, () => console.log('Listening on port 8000'));













/*

app.post('/hello', (req, res) => res.send(`Hey ${req.body.name}!`));
app.post('/api/articles/:name/upvote', (req, res) => {
    const articleName = req.params.name;

    articlesInfo[articleName].upvotes += 1;
    res.status(200).send(`${articleName} now has ${articlesInfo[articleName].upvotes} upvotes!`);

})
app.post('/api/articles/:name/add-comment', (req, res) => {
    const {username, text} = req.body;
    const articleName = req.params.name;

    console.log(username);

    articlesInfo[articleName].comments.push({username, text});
    res.status(200).send(articlesInfo[articleName]);

})
*/