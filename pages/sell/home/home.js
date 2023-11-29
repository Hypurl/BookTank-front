const app = getApp()
let confirmed = false
Component({
  options: {
    addGlobalClass: true
  },
  data: {
    translate: app.globalData.translate
  },
  attached() {
    this.updateData()
  },
  methods: {
    updateData() {
      let items = []
      let selling = []
      let reserved = []
      Object.keys(app.globalData.items).forEach(key => {
        if (app.globalData.items[key].userID == app.globalData.userID) {
          items.push(key)
        }
      })
      Object.keys(app.globalData.products).forEach(productID => {
        let product = app.globalData.products[productID]
        if (product.seller == app.globalData.userID && product.status != "Deleted") {
          product.items.forEach(item => {
            items.splice(items.indexOf(item), 1)
          })
          if (product.status == "Selling") {
            selling.push({
              productID: productID,
              dateModified: product.dateModified
            })
          } else if (product.status == "Reserved") {
            reserved.push({
              productID: productID,
              dateModified: product.dateModified
            })
          }
        }
      })
      items.reverse()
      selling.sort((a, b) => {
        return new Date(b.dateModified) - new Date(a.dateModified)
      })
      reserved.sort((a, b) => {
        return new Date(b.dateModified) - new Date(a.dateModified)
      })

      this.setData({
        items: items,
        selectedItems: new Array(items.length).fill(false),
        selectedItemsCount: 0,
        selling: selling,
        reserved: reserved
      })

      this.selectAllComponents("#item").forEach(item => item.updateData())
    },
    addItem() {
      wx.navigateTo({
        url: "/pages/sell/add/add"
      })
    },
    selectItem(event) {
      this.data.selectedItems[event.currentTarget.dataset.index] = !this.data.selectedItems[event.currentTarget.dataset.index]
      this.setData({
        selectedItems: this.data.selectedItems,
        selectedItemsCount: this.data.selectedItems.filter(Boolean).length
      })
    },
    deleteItems() {
      if (!confirmed) {
        this.setData({
          confirmModal: true
        })
        return
      }
      wx.showLoading({
        title: "Loading",
        mask: true
      })
      let data = {
        action: "deleteItems",
        items: []
      }
      for (let i = 0; i < this.data.selectedItems.length; i++) {
        if (this.data.selectedItems[i]) {
          data.items.push(this.data.items[i])
        }
      }
      wx.request({
        method: "POST",
        url: app.globalData.address,
        data: data,
        success: res => {
          app.globalData.items = res.data.items
          this.updateData()
          this.setData({
            confirmModal: false
          })
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    },
    showSellModal() {
      this.setData({
        sellModal: true,
        invalidName: false,
        invalidPrice: false
      })
    },
    hideSellModal(event) {
      if (event.target.id == "gray-area") {
        this.setData({
          sellModal: false,
          editing: false
        })
      }
    },
    sell(event) {
      wx.requestSubscribeMessage({
        tmplIds: ["ljPGZQoxrtzhMaFUnAu1WRiKoCDzIS9N0PQc-Hg0u4o", "bJjeMKElvFTly0cDfWyLvDEEmphbYHyIY5lPg_-u-mo"]
      })
      this.setData({
        invalidName: this.data.selectedItemsCount >= 2 && event.detail.value["name"].trim() == "",
        invalidPrice: event.detail.value["price"].length == 0
      })
      if (!this.data.invalidName && !this.data.invalidPrice) {
        wx.showLoading({
          title: "Loading",
          mask: true
        })
        let data = {
          userID: app.globalData.userID,
          action: "sell",
          name: this.data.selectedItemsCount >= 2 ? event.detail.value["name"].trim() : app.globalData.items[this.data.items[this.data.selectedItems.indexOf(true)]].name,
          items: [],
          images: [],
          price: event.detail.value["price"],
          additionalInformation: event.detail.value["additional-information"]
        }
        for (let i = 0; i < this.data.selectedItems.length; i++) {
          if (this.data.selectedItems[i]) {
            data.items.push(this.data.items[i])
            if (data.images.length < 4) {
              data.images.push(app.globalData.items[this.data.items[i]].images[0])
            }
          }
        }
        wx.request({
          method: "POST",
          url: app.globalData.address,
          data: data,
          success: res => {
            app.globalData.users = res.data.users
            app.globalData.products = res.data.products
            app.globalData.items = res.data.items
            this.setData({
              sellModal: false
            })
            this.updateData()
          },
          complete: () => {
            wx.hideLoading()
          }
        })
      }
    },
    viewProductModal(event) {
      this.setData({
        productModal: true,
        productModalID: event.currentTarget.dataset.id
      })
    },
    hideProductModal(event) {
      this.setData({
        productModal: false
      })
      this.updateData()
      if (event.detail && event.detail.action == "editProduct") {
        this.showSellModal()
        this.setData({
          editing: true,
          editingID: event.detail.productID,
          name: app.globalData.products[event.detail.productID].items.length > 1 ? app.globalData.products[event.detail.productID].name : "",
          price: app.globalData.products[event.detail.productID].price,
          additionalInformation: app.globalData.products[event.detail.productID].additionalInformation
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
              sellModal: false,
              editing: false
            })
            this.updateData()
          },
          complete: () => {
            wx.hideLoading()
          }
        })
      }
    },
    viewAll(event) {
      wx.navigateTo({
        url: `/pages/sell/all/all?status=${event.currentTarget.dataset.status}`
      })
    },
    hideConfirmModal(event) {
      if (event.detail) {
        confirmed = true
        this.deleteItems()
        confirmed = false
      } else {
        this.setData({
          confirmModal: false
        })
      }
    }
  }
})