const app = getApp()
let firstName = ""
let lastName = ""
let wechatID = ""
Component({
  options: {
    addGlobalClass: true
  },
  data: {
    identity: 0,
    identities: ["Student", "Parent", "Teacher", "Other"],
    translate: app.globalData.translate
  },
  attached() {
    this.setData({
      register: !app.globalData.users[app.globalData.userID].name,
      invalidFirstName: false,
      invalidLastName: false,
      invalidIdentity: false,
      invalidWeChatID: false,
      checked: false
    })
    let user = app.globalData.users[app.globalData.userID]
    if (user.name) {
      firstName = user.name.substring(0, user.name.indexOf(" "))
      lastName = user.name.substring(user.name.indexOf(" ") + 1)
      wechatID = user.wechatID
      this.setData({
        firstName: firstName,
        lastName: lastName,
        identity: this.data.identities.indexOf(user.identity),
        identityLabel: true,
        wechatID: wechatID
      })
    }
  },
  methods: {
    hideRegisterModal(event) {
      if (event.target.id == "gray-area") {
        this.triggerEvent("hideRegisterModal")
      }
    },
    storeFirstName(event) {
      firstName = event.detail.value
    },
    storeLastName(event) {
      lastName = event.detail.value
    },
    storeWeChatID(event) {
      wechatID = event.detail.value
    },
    storeIdentity(event) {
      this.setData({
        identity: event.detail.value,
        identityLabel: true
      })
    },
    submitUserInfo() {
      if (this.data.register && !this.data.checked) {
        return
      }
      wx.getUserProfile({
        desc: "Obtaining Profile Picture",
        success: res => {
          this.setData({
            invalidFirstName: false,
            invalidLastName: false,
            invalidIdentity: false,
            invalidWeChatID: false
          })
          firstName = firstName.replace(/\s/g, "").replace(/\d/g, "")
          lastName = lastName.replace(/\s/g, "").replace(/\d/g, "")
          wechatID = wechatID.replace(/\s/g, "")
          if (!firstName) {
            this.setData({
              invalidFirstName: true
            })
          }
          if (!lastName) {
            this.setData({
              invalidLastName: true
            })
          }
          if (!this.data.identityLabel) {
            this.setData({
              invalidIdentity: true
            })
          }
          if (!wechatID) {
            this.setData({
              invalidWeChatID: true
            })
          }
          if (firstName && lastName && this.data.identityLabel && wechatID) {
            wx.showLoading({
              title: "Loading",
              mask: true
            })
            firstName = firstName[0].toUpperCase() + firstName.slice(1)
            lastName = lastName[0].toUpperCase() + lastName.slice(1)
            wx.request({
              method: "POST",
              url: app.globalData.address,
              data: {
                userID: app.globalData.userID,
                action: "register",
                name: firstName + " " + lastName,
                accountType: this.data.identities[this.data.identity],
                wechatID: wechatID,
                URL: res.userInfo.avatarUrl
              },
              success: res => {
                app.globalData.users[app.globalData.userID].name = firstName + " " + lastName
                app.globalData.users[app.globalData.userID].identity = this.data.identities[this.data.identity]
                app.globalData.users[app.globalData.userID].wechatID = wechatID
                app.globalData.users[app.globalData.userID].profilePicture = res.data.profilePicture
                this.triggerEvent("hideRegisterModal")
              },
              complete: () => {
                wx.hideLoading()
              }
            })
          }
        }
      })
    },
    checkboxChange() {
      this.setData({
        checked: !this.data.checked
      })
    },
    viewUserServicesAgreement() {
      wx.navigateTo({
        url: "/pages/browse/agreement/agreement"
      })
    },
    viewPrivacyPolicy() {
      wx.navigateTo({
        url: "/pages/browse/policy/policy"
      })
    }
  }
})