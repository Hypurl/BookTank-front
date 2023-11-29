const app = getApp()
Page({
  data: {
    translate: app.globalData.translate
  },
  onLoad(event) {
    this.setData({
      status: event.status,
      products: this.getProducts(event.status)
    })
  },
  getProducts(status) {
    let products = []
    Object.keys(app.globalData.products).forEach(productID => {
      let product = app.globalData.products[productID]
      if (product.seller == app.globalData.userID && product.status == status) {
        products.push({
          productID: productID,
          dateModified: product.dateModified
        })
      }
    })
    products.sort((a, b) => {
      return new Date(b.dateModified) - new Date(a.dateModified)
    })
    return products
  },
  viewProductModal(event) {
    this.setData({
      productModal: true,
      productModalID: event.currentTarget.dataset.id
    })
  },
  hideProductModal(event) {
    this.setData({
      productModal: false,
      products: this.getProducts(this.data.status)
    })
    if (event.detail && event.detail.action == "editProduct") {
      this.setData({
        sellModal: true,
        editingID: event.detail.productID,
        name: app.globalData.products[event.detail.productID].items.length > 1 ? app.globalData.products[event.detail.productID].name : "",
        price: app.globalData.products[event.detail.productID].price,
        additionalInformation: app.globalData.products[event.detail.productID].additionalInformation
      })
    }
  },
  hideSellModal(event) {
    if (event.target.id == "gray-area") {
      this.setData({
        sellModal: false
      })
    }
  },
  edit(event) {
    this.setData({
      invalidName: app.globalData.products[this.data.editingID].items.length > 1 && event.detail.value["name"].trim() == "",
      invalidPrice: event.detail.value["price"].length == 0
    })
    if (!this.data.invalidName && !this.data.invalidPrice) {
      wx.showLoading({
        title: "Loading",
        mask: true
      })
      wx.request({
        method: "POST",
        url: app.globalData.address,
        data: {
          action: "edit",
          productID: this.data.editingID,
          name: app.globalData.products[this.data.editingID].items.length > 1 ? event.detail.value["name"].trim() : app.globalData.products[this.data.editingID].name,
          price: event.detail.value["price"],
          additionalInformation: event.detail.value["additional-information"]
        },
        success: res => {
          app.globalData.users = res.data.users
          app.globalData.products = res.data.products
          app.globalData.items = res.data.items
          this.setData({
            sellModal: false
          })
          this.selectAllComponents("#product").forEach(product => {
            product.setData({
              product: app.globalData.products[product.data.productID]
            })
          })
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    }
  }
})