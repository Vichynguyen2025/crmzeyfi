#!/usr/bin/env python3
import sys

path = sys.argv[1]
with open(path, 'r') as f:
    c = f.read()

c = c.replace(
    'const showToast\n\n  const load',
    'const showToast = (type:\'success\'|\'error\', msg:string) => { setToast({type,msg}); setTimeout(()=>setToast(null),2000); };\n\n  const load'
)

c = c.replace(
    '<div className="{\'fixed\' top-6',
    '<div className={\'fixed\' top-6'
)

with open(path, 'w') as f:
    f.write(c)
print('Fixed')