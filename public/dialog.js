class Dialog {
  constructor() {
    this.element = document.createElement("dialog");
    const content = document.createElement("div");

    content.className = "content";

    this.element.appendChild(content);
    document.body.appendChild(this.element);
  }

  show() {
    this.element.showModal();
  }

  hide() {
    this.element.close();
  }
}

class MessageDialog extends Dialog {
  constructor() {
    super();
    const content = this.element.querySelector(".content");
    const message = document.createElement("div");
    const confirmButton = document.createElement("button");

    message.className = "message";
    confirmButton.innerText = "확인";
    confirmButton.value = "default";
    confirmButton.addEventListener("click", () => this.hide());

    content.append(message, confirmButton);
  }

  setMessage(message) {
    this.element.querySelector(".message").innerText = message;
  }

  onClose(callback) {
    this.element.addEventListener("close", () => this.element.returnValue === "default" && callback());
  }
}

class InputDialog extends Dialog {
  constructor() {
    super();
    const content = this.element.querySelector(".content");
    const confirmButton = document.createElement("button");
    const cancelButton = document.createElement("button");
    const buttons = document.createElement("div");
    const input = document.createElement("input");
    const form = document.createElement("form");
    const message = document.createElement("div");

    message.className = "message";
    confirmButton.innerText = "확인";
    confirmButton.value = "";
    cancelButton.innerText = "취소";
    cancelButton.value = "cancel";
    form.method = "dialog";

    buttons.append(confirmButton, cancelButton);
    form.append(input, buttons);
    content.append(message, form);

    input.addEventListener("change", () => (confirmButton.value = input.value));
  }

  setMessage(message) {
    this.element.querySelector(".message").innerText = message;
  }

  onClose(callback) {
    this.element.addEventListener("close", () => {
      callback(this.element.returnValue);
      this.element.querySelector("input").value = "";
    });
  }
}
