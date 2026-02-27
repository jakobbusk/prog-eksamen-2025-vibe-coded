class User {
  constructor({ id, username, email, password_hash, created_at }) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.passwordHash = password_hash;
    this.createdAt = created_at;
  }

  toPublic() {
    return { id: this.id, username: this.username, email: this.email, createdAt: this.createdAt };
  }
}

module.exports = User;
