const host = "http://localhost:5000";
// const host = "http://203.171.20.94:5000";
const baseUrl = `${host}/api`;

function RequestUrl(path, allowed = []) {
    const readUrl = () => {
        return `${baseUrl}${path}`;
    };
    const readByIdUrl = (id) => {
        return `${baseUrl}${path}/${id}`;
    };
    const createUrl = () => {
        return `${baseUrl}${path}`;
    };
    const updateUrl = ({ id, useId = true }) => {
        return useId ? `${baseUrl}${path}/${id}` : `${baseUrl}${path}`;
    };
    const deleteUrl = (id) => {
        return `${baseUrl}${path}/${id}`;
    };
    let returnFn = {
        readUrl: allowed[0] ? readUrl : null,
        readByIdUrl: allowed[1] ? readByIdUrl : null,
        createUrl: allowed[2] ? createUrl : null,
        updateUrl: allowed[3] ? updateUrl : null,
        deleteUrl: allowed[4] ? deleteUrl : null,
    };
    Object.keys(returnFn).forEach((key) => {
        if (returnFn[key] === null) {
            delete returnFn[key];
        }
    });
    return returnFn;
}

const requestUrl = {
    car: new RequestUrl("/cars", [1, 0, 1, 1, 0]),
    rfid: new RequestUrl("/rfids", [1, 0, 1, 1, 0]),
    user: new RequestUrl("/users", [1, 1, 1, 1, 1]),
    template: new RequestUrl("/mailtemplates", [1, 1, 1, 1, 1]),
    maintain: new RequestUrl("/maintains", [1, 1, 1, 1, 1]),
    insurance: new RequestUrl("/insurances", [1, 1, 1, 1, 1]),
    registry: new RequestUrl("/registries", [1, 1, 1, 1, 1]),
    replaceOil: new RequestUrl("/replaceOils", [1, 1, 1, 1, 1]),
    repair: new RequestUrl("/repairs", [1, 1, 1, 1, 1]),
    userUnit: new RequestUrl("/users/units", [1, 0, 0, 0, 0]),
    driver: new RequestUrl("/members/drivers", [1, 0, 1, 1, 0]),
    treasure: new RequestUrl("/members/treasurers", [1, 0, 1, 1, 0]),
    atmTechnican: new RequestUrl("/members/atm-technicans", [1, 0, 1, 1, 0]),
    escort: new RequestUrl("/members/escorts", [1, 0, 1, 1, 0]),
    device: new RequestUrl("/devices", [1, 0, 1, 1, 0]),
    scope: new RequestUrl("/scopes", [1, 0, 0, 0, 0]),
    transactionPoint: new RequestUrl("/transaction-points", [1, 0, 1, 1, 0]),
    segmentation: new RequestUrl("/segmentations", [1, 0, 1, 1, 0]),
    segmentationRoute: new RequestUrl("/segmentations/route", [0, 0, 0, 1, 0]),
    route: new RequestUrl("/routes", [1, 0, 1, 1, 0]),
    permission: new RequestUrl("/permissions", [1, 0, 0, 1, 0]),
    scopePermission: new RequestUrl("/permissions/scopes", [1, 0, 1, 0, 0]),
    userLogin: new RequestUrl("/users/login", [1, 0, 0, 0, 0]),
    unit: new RequestUrl("/units", [1, 0, 1, 1, 0]),
    updateUserPassword: new RequestUrl("/users/password", [0, 0, 0, 1, 0]),
    online: new RequestUrl("/onlines", [1, 0, 0, 0, 0]),
    history: new RequestUrl("/histories", [1, 0, 0, 0, 0]),
    carReport: new RequestUrl("/reports/car", [1, 0, 0, 0, 0]),
    report: new RequestUrl("/reports", [0, 0, 1, 0, 0]),
    uploadAvata: new RequestUrl("/members/upload-avata", [0, 0, 1, 0, 0]),
    scopeAllowedRoute: new RequestUrl(
        "/permissions/allowed-routes",
        [0, 1, 0, 1, 0]
    ),
};

export { baseUrl, requestUrl, host };
