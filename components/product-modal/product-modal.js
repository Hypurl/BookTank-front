const app = getApp()
let confirmed = false
let confirmFunction = ""
Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    productID: {
      type: Number
    }
  },
  data: {
    translate: app.globalData.translate
  },
  attached() {
    this.setData({
      product: app.globalData.products[this.data.productID],
      userID: app.globalData.userID
    })
  },
  methods: {
    hideProductModal(event) {
      if (event.target.id == "gray-area") {
        this.triggerEvent("hideProductModal")
      }
    },
    viewProduct() {
      this.triggerEvent("hideProductModal")
      wx.navigateTo({
        url: `/pages/browse/product/product?id=${this.data.productID}`
      })
    },
    editProduct() {
      this.triggerEvent("hideProductModal", {
        action: "editProduct",
        productID: this.data.productID
      })
    },
    deleteProduct() {
      if (!confirmed) {
        this.setData({
          confirmModal: true
        })
        confirmFunction = "deleteProduct"
        return
      }
      wx.showLoading({
        title: "Loading",
        mask: true
      })
      wx.request({
        method: "POST",
        url: app.globalData.address,
        data: {
          action: "deleteProduct",
          productID: this.data.productID
        },
        success: res => {
          app.globalData.users = res.data.users
          app.globalData.products = res.data.products
          app.globalData.items = res.data.items
          this.triggerEvent("hideProductModal")
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    },
    deleteProductCompletely() {
      if (!confirmed) {
        this.setData({
          confirmModal: true
        })
        confirmFunction = "deleteProductCompletely"
        return
      }
      wx.showLoading({
        title: "Loading",
        mask: true
      })
      wx.request({
        method: "POST",
        url: app.globalData.address,
        data: {
          action: "deleteProductCompletely",
          productID: this.data.productID
        },
        success: res => {
          app.globalData.users = res.data.users
          app.globalData.products = res.data.products
          app.globalData.items = res.data.items
          this.triggerEvent("hideProductModal")
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    },
    contactBuyer() {
      app.readMessage(app.globalData.products[this.data.productID].buyer)
      wx.navigateTo({
        url: `/pages/chats/chat/chat?id=${app.globalData.products[this.data.productID].buyer}`
      })
      this.triggerEvent("hideProductModal")
    },
    cancelReservation() {
      if (!confirmed) {
        this.setData({
          confirmModal: true
        })
        confirmFunction = "cancelReservation"
        return
      }
      wx.showLoading({
        title: "Loading",
        mask: true
      })
      let contactID = app.globalData.products[this.data.productID].seller == app.globalData.userID ? app.globalData.products[this.data.productID].buyer : app.globalData.products[this.data.productID].seller
      wx.request({
        method: "POST",
        url: app.globalData.address,
        data: {
          userID: app.globalData.userID,
          action: "cancelReservation",
          productID: this.data.productID
        },
        success: res => {
          app.globalData.users = res.data.users
          app.globalData.products = res.data.products
          app.globalData.items = res.data.items
          app.globalData.reservations = res.data.reservations
          wx.redirectTo({
            url: `/pages/index/index?contactID=${contactID}`
          })
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    },
    contactSeller() {
      app.readMessage(app.globalData.products[this.data.productID].seller)
      wx.navigateTo({
        url: `/pages/chats/chat/chat?id=${app.globalData.products[this.data.productID].seller}`
      })
      this.triggerEvent("hideProductModal")
    },
    deleteReservation() {
      wx.showLoading({
        title: "Loading",
        mask: true
      })
      wx.request({
        method: "POST",
        url: app.globalData.address,
        data: {
          userID: app.globalData.userID,
          action: "deleteReservation",
          productID: this.data.productID
        },
        success: res => {
          app.globalData.reservations = res.data.reservations
          this.triggerEvent("hideProductModal")
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    },
    hideConfirmModal(event) {
      if (event.detail) {
        confirmed = true
        if (confirmFunction == "deleteProduct") {
          this.deleteProduct()
        } else if (confirmFunction == "deleteProductCompletely") {
          this.deleteProductCompletely()
        } else if (confirmFunction == "cancelReservation") {
          this.cancelReservation()
        }
        confirmed = false
      } else {
        this.triggerEvent("hideProductModal")
      }
    }
  }
})