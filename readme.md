# Exe-Version

本项目实现在Web端使用Javascript读取Windows系统中Exe，Dll文件携带的版本号。  

原理Exe，Dll文件携带的版本号在存储在文件头中，通过FileReader读取到文件的二进制数据，解析文件头即可拿到版本号。  

本项目翻译至go语言项目代码  

原文章地址：https://blog.csdn.net/CodyGuo/article/details/51009248