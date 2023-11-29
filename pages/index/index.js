const app = getApp()
Page({
  data: {
    StatusBar: app.globalData.StatusBar,
    pages: ["browse", "sell", "buy", "chats"],
    translate: app.globalData.translate
  },
  onLoad(event) {
    if (event.productID) {
      wx.showLoading({
        title: "Loading",
        mask: true
      })
      let redirect = () => {
        if (app.globalData.products) {
          wx.navigateTo({
            url: `/pages/browse/product/product?id=${event.productID}`
          })
          this.setData({
            currentPage: "browse"
          })
          wx.hideLoading()
        } else {
          setTimeout(() => {
            redirect()
          }, 500)
        }
      }
      redirect()
    } else if (event.contactID) {
      wx.navigateTo({
        url: `/pages/chats/chat/chat?id=${event.contactID}`
      })
      this.setData({
        currentPage: "chats"
      })
    } else {
      this.setData({
        currentPage: "enter"
      })
    }
  },
  enter() {
    wx.showLoading({
      title: "Loading",
      mask: true
    })
    let redirect = () => {
      if (app.globalData.products) {
        this.setData({
          currentPage: "browse"
        })
        this.updateNewMessages()
        wx.hideLoading()
      } else {
        setTimeout(() => {
          redirect()
        }, 500)
      }
    }
    redirect()
    if (!app.globalData.DevTools) {
      wx.requestSubscribeMessage({
        tmplIds: ["ljPGZQoxrtzhMaFUnAu1WRiKoCDzIS9N0PQc-Hg0u4o", "bJjeMKElvFTly0cDfWyLvDEEmphbYHyIY5lPg_-u-mo"]
      })
    }
  },
  redirectBuy(event) {
    this.setData({
      currentPage: "buy"
    })
    this.selectComponent("#buy").setData({
      currentTab: event.detail
    })
  },
  changePage(event) {
    if (event.currentTarget.dataset.page == "browse" || app.globalData.users[app.globalData.userID].name) {
      this.setData({
        currentPage: event.currentTarget.dataset.page
      })
    } else {
      this.showRegisterModal()
    }
  },
  onShow() {
    if (["sell", "buy", "chats"].includes(this.data.currentPage)) {
      this.selectComponent(`#${this.data.currentPage}`).updateData()
    }
    wx.onSocketMessage(message => {
      app.appendMessage(message)
      this.updateNewMessages()
      if (this.data.currentPage == "chats") {
        this.selectComponent("#chats").updateData()
      }
    })
    this.updateNewMessages()
  },
  updateNewMessages() {
    let newMessages = 0
    if (app.globalData.messages) {
      Object.keys(app.globalData.messages).forEach(contactID => newMessages += app.countNewMessages(contactID))
    }
    this.setData({
      newMessages: newMessages
    })
  },
  onPullDownRefresh() {
    if (!["sell", "buy", "chats"].includes(this.data.currentPage)) {
      wx.stopPullDownRefresh()
      return
    }
    wx.request({
      method: "POST",
      url: app.globalData.address,
      data: {
        userID: app.globalData.userID,
        action: "getData"
      },
      success: res => {
        app.globalData.users = res.data.users
        app.globalData.products = res.data.products
        app.globalData.items = res.data.items
        app.globalData.messages = res.data.messages
        app.globalData.bookmarks = res.data.bookmarks
        app.globalData.reservations = res.data.reservations
        this.updateNewMessages()
        this.selectComponent(`#${this.data.currentPage}`).updateData()
        wx.stopPullDownRefresh()
      },
      fail: () => {
        wx.stopPullDownRefresh()
      }
    })
  },
  showRegisterModal() {
    this.setData({
      registerModal: true
    })
  },
  hideRegisterModal() {
    this.setData({
      registerModal: false
    })
    if (this.data.currentPage == "chats") {
      this.selectComponent("#chats").updateData()
    }
  },
  onShareAppMessage() {
    return {
      path: "/pages/index/index",
      imageUrl: "/images/others/booktank.jpg"
    }
  }
})