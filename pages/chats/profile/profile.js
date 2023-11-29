const app = getApp()
Page({
  data: {
    translate: app.globalData.translate
  },
  onLoad(event) {
    let products = []
    Object.keys(app.globalData.products).forEach(productID => {
      let product = app.globalData.products[productID]
      if (product.status == "Selling" && product.seller == event.id) {
        products.push(productID)
      }
    })
    this.setData({
      userID: event.id,
      user: app.globalData.users[event.id],
      products: products.reverse(),
      messageButton: event.id != app.globalData.userID,
      address: app.globalData.address
    })
  },
  message() {
    wx.navigateTo({
      url: `/pages/chats/chat/chat?id=${this.data.userID}`
    })
  },
  copy(event) {
    app.copy(event.currentTarget.dataset.value)
  },
  viewProduct(event) {
    wx.navigateTo({
      url: `/pages/browse/product/product?id=${event.currentTarget.dataset.id}`
    })
  }
})