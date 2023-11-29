const app = getApp()
Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    keyboardHeight: 0,
    address: app.globalData.address,
    translate: app.globalData.translate
  },
  onLoad(event) {
    let addDate = messages => {
      if (!messages) {
        return []
      }
      let output = []
      let previousDate
      for (let message of messages) {
        let date = new Date(message[3])
        if (!previousDate || date - previousDate > 300000) {
          output.push([null, `${app.getDate(date)} ${app.getTime(date)}`, "Date"])
        }
        output.push(message)
        previousDate = date
      }
      return output
    }

    this.setData({
      contact: app.globalData.users[event.id],
      contactID: event.id,
      user: app.globalData.users[app.globalData.userID],
      userID: app.globalData.userID,
      messages: addDate(app.globalData.messages[event.id]),
      products: app.globalData.products
    })
    this.scrollToBottom()

    wx.onSocketMessage(message => {
      app.appendMessage(message)
      this.setData({
        messages: addDate(app.globalData.messages[event.id])
      })
      this.scrollToBottom()
      app.readMessage(event.id)
    })
  },
  raiseInput(event) {
    this.setData({
      keyboardHeight: event.detail.height
    })
    this.scrollToBottom()
  },
  lowerInput() {
    this.setData({
      keyboardHeight: 0
    })
  },
  send(event) {
    this.setData({
      input: ""
    })
    if (event.detail.value.trim() != "") {
      wx.sendSocketMessage({
        data: JSON.stringify({
          action: "sendMessage",
          message: event.detail.value.trim(),
          messageType: "Text",
          sender: app.globalData.userID,
          receiver: this.data.contactID
        })
      })
    }
  },
  scrollToBottom() {
    wx.createSelectorQuery().select("#chat").boundingClientRect(rect => {
      this.setData({
        scrollTop: rect.height
      })
    }).exec()
  },
  viewProduct(event) {
    wx.navigateTo({
      url: `/pages/browse/product/product?id=${event.currentTarget.dataset.id}`
    })
  },
  viewProfile(event) {
    wx.navigateTo({
      url: `/pages/chats/profile/profile?id=${event.currentTarget.dataset.id}`
    })
  },
  sendImages() {
    let sendImage = (i, images) => {
      wx.showLoading({
        title: `${i + 1}/${images.length}`,
        mask: true
      })
      let fileName = new Date().getTime() + ".jpg"
      wx.uploadFile({
        url: app.globalData.address,
        filePath: images[i],
        name: fileName,
        formData: {
          directory: "images/"
        },
        success: () => {
          wx.sendSocketMessage({
            data: JSON.stringify({
              action: "sendMessage",
              message: fileName,
              messageType: "Image",
              sender: app.globalData.userID,
              receiver: this.data.contactID
            }),
            success: () => {
              if (i == images - 1) {
                wx.hideLoading()
              } else {
                sendImage(i + 1, images)
              }
            },
            fail: () => {
              wx.hideLoading()
            }
          })
        },
        fail: () => {
          wx.hideLoading()
        }
      })
    }

    wx.chooseImage({
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: res => {
        sendImage(0, res.tempFilePaths)
      }
    })
  },
  viewImage(event) {
    let imageList = []
    this.data.messages.forEach(message => {
      if (message[2] == "Image") {
        imageList.push(`${this.data.address}/static/images/${message[1]}`)
      }
    })
    wx.previewImage({
      urls: imageList,
      current: event.currentTarget.dataset.url
    })
  },
  viewPayment(event) {
    wx.previewImage({
      urls: [event.currentTarget.dataset.url],
      current: event.currentTarget.dataset.url
    })
  },
  copy(event) {
    app.copy(event.currentTarget.dataset.value)
  },
  viewPaymentModal() {
    this.setData({
      paymentModal: true
    })
  },
  hidePaymentModal(event) {
    if (event.target.id == "gray-area") {
      this.setData({
        paymentModal: false,
        invalidPaymentCode: false
      })
    }
  },
  setPaymentCode() {
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album"],
      success: res => {
        wx.showLoading({
          title: "Loading",
          mask: true
        })
        let fileName = new Date().getTime() + ".jpg"
        wx.uploadFile({
          url: app.globalData.address,
          filePath: res.tempFilePaths[0],
          name: fileName,
          formData: {
            directory: "qr-codes/"
          },
          success: () => {
            wx.request({
              method: "POST",
              url: app.globalData.address,
              data: {
                userID: app.globalData.userID,
                action: "setPaymentCode",
                fileName: fileName
              },
              success: res => {
                app.globalData.users = res.data.users
                this.setData({
                  user: app.globalData.users[app.globalData.userID],
                  invalidPaymentCode: false
                })
              },
              complete: () => {
                wx.hideLoading()
              }
            })
          },
          fail: () => {
            wx.hideLoading()
          }
        })
      }
    })
  },
  sendPaymentCode() {
    this.setData({
      invalidPaymentCode: !this.data.user.paymentCode
    })
    if (!this.data.invalidPaymentCode) {
      wx.sendSocketMessage({
        data: JSON.stringify({
          action: "sendMessage",
          message: this.data.user.paymentCode,
          messageType: "Payment Code",
          sender: app.globalData.userID,
          receiver: this.data.contactID
        })
      })
      this.setData({
        paymentModal: false
      })
    }
  }
})