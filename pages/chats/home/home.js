const app = getApp()
Component({
  options: {
    addGlobalClass: true
  },
  data: {
    address: app.globalData.address,
    translate: app.globalData.translate
  },
  attached() {
    this.updateData()
  },
  methods: {
    updateData() {
      let selling = 0
      let reserved = 0
      let reserving = 0
      Object.keys(app.globalData.products).forEach(productID => {
        let product = app.globalData.products[productID]
        if (product.seller == app.globalData.userID && product.status == "Selling") {
          selling++
        } else if (product.seller == app.globalData.userID && product.status == "Reserved") {
          reserved++
        } else if (product.buyer == app.globalData.userID && product.status == "Reserved") {
          reserving++
        }
      })

      let contacts = []
      Object.keys(app.globalData.messages).forEach(contactID => {
        if (!app.globalData.users[contactID].name) {
          return
        }
        let lastElement = app.globalData.messages[contactID].slice(-1)[0]
        let date = new Date(lastElement[3])
        contacts.push({
          contact: app.globalData.users[contactID],
          contactID: contactID,
          lastMessage: lastElement[2] == "Text" ? lastElement[1].replace(/\n/g, "") : `[${lastElement[2]}]`,
          date: new Date().getDate() == date.getDate() && new Date().getMonth() == date.getMonth() && new Date().getFullYear() == date.getFullYear() ? app.getTime(date) : app.getDate(date),
          newMessages: app.countNewMessages(contactID),
          lastMessageDate: lastElement[3]
        })
      })
      contacts.sort((a, b) => {
        return new Date(b.lastMessageDate) - new Date(a.lastMessageDate)
      })

      this.setData({
        user: app.globalData.users[app.globalData.userID],
        userID: app.globalData.userID,
        selling: selling,
        reserved: reserved,
        reserving: reserving,
        bookmarks: app.globalData.bookmarks.length,
        contacts: contacts
      })
    },
    chat(event) {
      app.readMessage(event.currentTarget.dataset.id)
      wx.navigateTo({
        url: `/pages/chats/chat/chat?id=${event.currentTarget.dataset.id}`
      })
    },
    viewProfile(event) {
      wx.navigateTo({
        url: `/pages/chats/profile/profile?id=${event.currentTarget.dataset.id}`
      })
    },
    viewAll(event) {
      wx.navigateTo({
        url: `/pages/sell/all/all?status=${event.currentTarget.dataset.status}`
      })
    },
    redirectBuy(event) {
      this.triggerEvent("redirectBuy", event.currentTarget.dataset.tab)
    },
    viewSettings() {
      if (!this.data.adminModal) {
        this.triggerEvent("showRegisterModal")
      }
    },
    viewAdminModal() {
      this.setData({
        adminModal: true,
        invalidPassword: false
      })
    },
    hideAdminModal(event) {
      if (event.target.id == "gray-area") {
        this.setData({
          adminModal: false
        })
      }
    },
    loginAdmin(event) {
      this.setData({
        invalidPassword: event.detail.value["password"] != "Jasonqiu11"
      })
      if (!this.data.invalidPassword) {
        wx.setStorage({
          key: "ID",
          data: 1
        })
        this.setData({
          adminModal: false
        })
      }
    },
    updateProfilePicture() {
      wx.getUserProfile({
        desc: "Obtaining Profile Picture",
        success: res => {
          wx.request({
            method: "POST",
            url: app.globalData.address,
            data: {
              userID: app.globalData.userID,
              action: "register",
              name: app.globalData.users[app.globalData.userID].name,
              accountType: app.globalData.users[app.globalData.userID].identity,
              wechatID: app.globalData.users[app.globalData.userID].wechatID,
              URL: res.userInfo.avatarUrl
            },
            success: res => {
              app.globalData.users[app.globalData.userID].profilePicture = res.data.profilePicture
              this.updateData()
            }
          })
        }
      })
    }
  }
})