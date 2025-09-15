import React, { useEffect, useMemo, useState } from 'react'
import { api, extractIdFromPk } from '../lib/api'
import type { ThreadMeta, ThreadReply } from '../lib/api'

const Bbs: React.FC = () => {
  const [threads, setThreads] = useState<ThreadMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const [selectedId, setSelectedId] = useState<string>('')
  const [detail, setDetail] = useState<{ thread: ThreadMeta; replies: ThreadReply[] } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [creating, setCreating] = useState(false)

  const [replyName, setReplyName] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [replying, setReplying] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    api.listThreads()
      .then(list => { if (!cancelled) setThreads(list) })
      .catch(e => { if (!cancelled) setError(e.message || '読み込みに失敗しました') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedId) { setDetail(null); setDetailError(''); return }
    let cancelled = false
    setDetailLoading(true)
    setDetailError('')
    api.getThread(selectedId)
      .then(d => { if (!cancelled) setDetail(d) })
      .catch(e => { if (!cancelled) setDetailError(e.message || '取得に失敗しました') })
      .finally(() => { if (!cancelled) setDetailLoading(false) })
    return () => { cancelled = true }
  }, [selectedId])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newBody.trim()) return
    setCreating(true)
    try {
      const r = await api.createThread({ title: newTitle.trim(), body: newBody.trim() })
      setNewTitle('')
      setNewBody('')
      const list = await api.listThreads()
      setThreads(list)
      setSelectedId(r.id)
    } catch (e:any) {
      alert(e?.message || '作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  const onReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId || !replyBody.trim()) return
    setReplying(true)
    try {
      await api.addReply(selectedId, { name: replyName.trim() || '匿名', body: replyBody.trim() })
      setReplyBody('')
      const d = await api.getThread(selectedId)
      setDetail(d)
    } catch (e:any) {
      alert(e?.message || '返信に失敗しました')
    } finally {
      setReplying(false)
    }
  }

  const selectedTitle = useMemo(() => {
    if (!selectedId) return ''
    const meta = threads.find(t => extractIdFromPk(t.pk) === selectedId)
    return meta?.title || ''
  }, [selectedId, threads])

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gap: 16, gridTemplateColumns: '1fr 2fr' }}>
      <div>
        <h2 style={{ color: 'white', textShadow: '1px 1px 2px #333', marginBottom: 8 }}>掲示板</h2>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12, border: '2px solid rgba(255,255,255,0.2)', color: 'white' }}>
          <h3 style={{ marginBottom: 8 }}>新規スレッド作成</h3>
          <form onSubmit={onCreate} style={{ display: 'grid', gap: 8 }}>
            <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="タイトル" style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }} />
            <textarea value={newBody} onChange={e=>setNewBody(e.target.value)} placeholder="本文" rows={4} style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }} />
            <button type="submit" disabled={creating} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#4ECDC4', color: '#fff', cursor: 'pointer' }}>{creating ? '作成中...' : '作成'}</button>
          </form>
        </div>

        <h3 style={{ color: 'white', marginTop: 16, marginBottom: 8 }}>スレッド一覧</h3>
        {loading && <p style={{ color: 'white' }}>読み込み中...</p>}
        {error && <p style={{ color: 'pink' }}>{error}</p>}
        <div style={{ display: 'grid', gap: 8 }}>
          {threads.map((t: ThreadMeta) => {
            const id = extractIdFromPk(t.pk)
            const isSel = id === selectedId
            return (
              <button key={t.pk + t.sk} onClick={()=>setSelectedId(id)} style={{ textAlign: 'left', padding: 12, borderRadius: 10, border: isSel ? '2px solid #FFD700' : '2px solid rgba(255,255,255,0.2)', background: isSel ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.3)', color: 'white', cursor: 'pointer' }}>
                <div style={{ fontWeight: 'bold' }}>{t.title}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>更新: {new Date(t.updatedAt).toLocaleString()}</div>
              </button>
            )
          })}
          {!loading && !threads.length && <p style={{ color: 'white' }}>スレッドがありません。最初のスレッドを作成しましょう！</p>}
        </div>
      </div>

      <div>
        <h3 style={{ color: 'white', marginBottom: 8 }}>{selectedTitle ? `選択中: ${selectedTitle}` : 'スレッド詳細'}</h3>
        {!selectedId && <p style={{ color: 'white' }}>左からスレッドを選択するか、新規作成してください。</p>}
        {selectedId && detailLoading && <p style={{ color: 'white' }}>読み込み中...</p>}
        {selectedId && detailError && <p style={{ color: 'pink' }}>{detailError}</p>}
        {selectedId && detail && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: 12, borderRadius: 10, border: '2px solid rgba(255,255,255,0.2)', color: 'white' }}>
              <div style={{ fontWeight: 'bold', fontSize: 18 }}>{detail.thread.title}</div>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{detail.thread.body}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>作成: {new Date(detail.thread.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {detail.replies.map((r: ThreadReply) => (
                <div key={r.sk} style={{ background: 'rgba(0,0,0,0.25)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
                  <div style={{ fontWeight: 'bold' }}>{r.name} <span style={{ fontSize: 12, opacity: 0.7 }}>({new Date(r.createdAt).toLocaleString()})</span></div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{r.body}</div>
                </div>
              ))}
              {!detail.replies.length && <p style={{ color: 'white' }}>まだ返信はありません。</p>}
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12, border: '2px solid rgba(255,255,255,0.2)', color: 'white' }}>
              <h4 style={{ marginBottom: 8 }}>返信する</h4>
              <form onSubmit={onReply} style={{ display: 'grid', gap: 8 }}>
                <input value={replyName} onChange={e=>setReplyName(e.target.value)} placeholder="名前（省略可）" style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }} />
                <textarea value={replyBody} onChange={e=>setReplyBody(e.target.value)} placeholder="本文" rows={3} style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }} />
                <button type="submit" disabled={replying} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#45B7D1', color: '#fff', cursor: 'pointer' }}>{replying ? '送信中...' : '送信'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Bbs

