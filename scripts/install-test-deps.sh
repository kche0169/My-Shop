#!/bin/bash

echo "正在安装测试依赖..."

npm install --save-dev jest@29 supertest@6

echo ""
echo "✅ 测试依赖安装完成!"
echo ""
echo "运行测试命令:"
echo "  npm test           # 运行所有测试"
echo "  npm run test:watch # 监听模式"
echo "  npm run test:coverage # 覆盖率报告"
