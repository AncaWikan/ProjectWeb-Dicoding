const UrlParser = {
  parseActiveUrlWithCombiner() {
    const url = window.location.hash.slice(1).toLowerCase() || "/";
    const urlSplit = this.urlSplitter(url);
    return this.urlCombiner(urlSplit);
  },

  urlSplitter(url) {
    const urlsSplit = url.split("/");
    return {
      resource: urlsSplit[1] || null,
      id: urlsSplit[2] || null,
      verb: urlsSplit[3] || null,
    };
  },

  urlCombiner(urlSplit) {
    return `/${urlSplit.resource || ""}${urlSplit.id ? "/:id" : ""}${
      urlSplit.verb ? `/${urlSplit.verb}` : ""
    }`.replace("//", "/");
  },
};

export default UrlParser;
