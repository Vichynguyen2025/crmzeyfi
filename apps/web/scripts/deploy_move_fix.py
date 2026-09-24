python3 << 'PYEOF'
with open('/opt/crmzeyfi-staging/apps/web/src/pages/Drive.tsx') as f:
    c = f.read()

insert = """      {/* Move modal */}
      {moveFileId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setMoveFileId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{boxShadow:'rgba(0,0,0,0.12) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 4px 12px'}} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-ink">Di chuyển đến thư mục</h3>
              <button onClick={() => setMoveFileId(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} className="text-muted" /></button>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto space-y-1">
              <button onClick={async () => { try { await api('/drive/' + moveFileId, { method:'PUT', body:JSON.stringify({ parentId: null }) }); showToast('success', 'Đã di chuyển'); setMoveFileId(null); location.reload(); } catch { showToast('error', 'Lỗi'); } }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition-all text-left">
                <Folder size={18} className="text-amber-500" />
                <span className="text-sm font-medium text-ink">Thư mục gốc</span>
              </button>
              {(files||[]).filter((f:any) => f.type === 'folder' && f.id !== currentFolder).map((f:any) => (
                <button key={f.id} onClick={async () => { try { await api('/drive/' + moveFileId, { method:'PUT', body:JSON.stringify({ parentId: f.id }) }); showToast('success', 'Đã di chuyển'); setMoveFileId(null); location.reload(); } catch { showToast('error', 'Lỗi'); } }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition-all text-left">
                  <Folder size={18} className="text-amber-500" />
                  <span className="text-sm font-medium text-ink">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
"""

# Find a good insertion point - after showFolderPicker modal
picker = c.find('showFolderPicker')
if picker >= 0:
    picker_end = c.find(')}', picker) 
    # Find the full closing of the picker modal
    # Look for ")}" after the picker modal content
    picker_close = c.find(')}\n      {/* Preview */}', picker)
    if picker_close > 0:
        insert_at = picker_close + len(')}')
    else:
        # Find the last ")}" before preview
        preview = c.find('{previewUrl && (', picker)  
        if preview >= 0:
            insert_at = preview - 50
        else:
            # Find the component end
            insert_at = c.rfind('\n    </div>\n  )')  
    
    c = c[:insert_at] + insert + c[insert_at:]
    with open('/opt/crmzeyfi-staging/apps/web/src/pages/Drive.tsx', 'w') as f:
        f.write(c)
    print('Done')
else:
    print('picker not found')
PYEOF