// The product list for the shop. Edit it and push to change what is sold. Prices are read here, on the server, never from the browser.
//   type: 'physical'  ships inside India only, needs an address; stock is tracked when "stock" is a number
//   type: 'digital'   delivered as a download link after payment; "file" is the url the link sends the buyer to
//   priceInr: price in rupees (GST included). active: false hides a product without deleting it.
module.exports = {
  shipping: { flatInr: 60, freeAboveInr: 999 },        // charged once per order that contains a physical item
  products: [
    // { id: 'couple-mug', name: 'Couple mug set', type: 'physical', priceInr: 799, stock: 25, description: '', image: '', active: true },
    // { id: 'love-notes', name: 'Love notes pack', type: 'digital', priceInr: 199, file: 'https://example.com/private/love-notes.pdf', description: '', image: '', active: true },
  ],
};
