const noteCard = document.querySelector('[data-note-endpoint]');
const form = document.getElementById('noteForm');
const list = document.getElementById('noteList');
const statusEl = document.getElementById('noteStatus');

if (noteCard && form && list && statusEl) {
  const endpoint = noteCard.dataset.noteEndpoint || '/api/posts';
  const submitButton = form.querySelector('button[type="submit"]');

  const formatDate = (iso) => {
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    return formatter.format(new Date(iso));
  };

  const showStatus = (message, tone = 'info') => {
    statusEl.textContent = message;
    statusEl.dataset.tone = tone;
  };

  const renderEmpty = (message) => {
    list.innerHTML = '';
    const empty = document.createElement('li');
    empty.className = 'note-card__empty';
    empty.textContent = message;
    list.appendChild(empty);
  };

  const renderPosts = (items) => {
    list.innerHTML = '';
    items.forEach((post) => {
      const li = document.createElement('li');
      li.className = 'note-entry';

      const meta = document.createElement('div');
      meta.className = 'note-entry__meta';
      meta.innerHTML = `<strong>${post.name}</strong><span>${formatDate(
        post.createdAt
      )}</span>`;

      const body = document.createElement('p');
      body.textContent = post.message;

      li.append(meta, body);
      list.appendChild(li);
    });
  };

  const normalizeResponse = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  };

  const fetchPosts = async () => {
    showStatus('よみこみ中…');
    try {
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Failed to load posts: ${response.status}`);
      }
      const payload = await response.json();
      const posts = normalizeResponse(payload)
        .filter((item) => item && item.name && item.message)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (!posts.length) {
        renderEmpty('まだノートはありません。最初の1行を書いてみませんか。');
        showStatus('0件のノート');
        return;
      }

      renderPosts(posts);
      showStatus(`全${posts.length}件のノート`);
    } catch (error) {
      console.error(error);
      renderEmpty('投稿を読み込めませんでした。時間をおいて再度お試しください。');
      showStatus('読み込みに失敗しました', 'error');
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = (formData.get('name') || '').toString().trim();
    const message = (formData.get('message') || '').toString().trim();

    if (!name || !message) {
      return;
    }

    const payload = { name, message };
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = '投稿中…';
    }
    showStatus('投稿を送信しています…');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to post: ${errorBody}`);
      }

      form.reset();
      showStatus('投稿が公開されました。', 'success');
      await fetchPosts();
    } catch (error) {
      console.error(error);
      showStatus('投稿に失敗しました。時間をおいてやり直してください。', 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = '投稿する';
      }
    }
  });

  fetchPosts();
}
